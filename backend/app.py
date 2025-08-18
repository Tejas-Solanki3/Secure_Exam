# backend/app.py
from flask import Flask, request, jsonify, render_template, send_file, session, redirect, url_for
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
import os
import base64
import datetime
import uuid
import json
import csv
from bson import ObjectId

load_dotenv()
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
app = Flask(__name__, static_folder=os.path.join(PROJECT_ROOT, "frontend", "static"), template_folder=os.path.join(PROJECT_ROOT, "frontend", "templates"))
CORS(app)
app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'a-very-strong-secret-key-in-production')

MONGO_URI = os.environ.get('MONGO_URI')
client = MongoClient(MONGO_URI)
db = client.secure_exam_lite
users_collection = db.users
tests_collection = db.tests
submissions_collection = db.submissions

print("[DB_CONNECT] Successfully connected to MongoDB.")

def create_dummy_test_if_not_exists():
    dummy_test_id = "dummy-test-01"
    if tests_collection.count_documents({"test_id": dummy_test_id}) == 0:
        print(f"Creating dummy test with ID: {dummy_test_id}")
        dummy_test = {
            "test_id": dummy_test_id, "name": "Sample Physics Test", "code": "PHY-DUMMY", "duration_seconds": 600,
            "questions": [
                {"type": "mcq", "text": "What is the unit of force?", "options": ["Newton", "Watt", "Joule", "Pascal"], "answer": "Newton"},
                {"type": "subjective", "text": "Explain Newton's Second Law of Motion."}
            ], "created_at": datetime.datetime.utcnow()
        }
        tests_collection.insert_one(dummy_test)
create_dummy_test_if_not_exists()

UPLOAD_FOLDER = os.path.join(PROJECT_ROOT, "backend", "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def mongo_serializer(obj):
    if isinstance(obj, (ObjectId, datetime.datetime)): return str(obj)
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

def save_base64_image(base64_data, upload_dir, filename_prefix):
    try:
        if ";base64," in base64_data:
            header, encoded = base64_data.split(",", 1)
        else:
            encoded = base64_data
        decoded_data = base64.b64decode(encoded)
        unique_filename = f"{filename_prefix}_{datetime.datetime.utcnow().strftime('%Y%m%d%H%M%S')}.jpeg"
        file_path = os.path.join(upload_dir, unique_filename)
        with open(file_path, 'wb') as f: f.write(decoded_data)
        return file_path
    except Exception: return None

@app.route("/")
@app.route("/homepage.html")
def home(): return render_template('homepage.html')
@app.route("/login.html")
def login_page(): return render_template('login.html')
@app.route("/student_dashboard.html")
def student_dashboard_page(): return render_template('student_dashboard.html')
@app.route("/exam.html")
def exam_page(): return render_template('exam.html')
@app.route("/admin_dashboard.html")
def admin_dashboard_page(): return render_template('admin_dashboard.html')
@app.route("/admin_login.html")
def admin_login_page(): return render_template('admin_login.html')
@app.route("/submission_success.html")
def submission_success(): return render_template('submission_success.html')
@app.route("/past_answers.html")
def past_answers_page(): return render_template('past_answers.html')
@app.route("/admin_review.html")
def admin_review_page(): return render_template('admin_review.html')
@app.route("/student_results.html")
def student_results_page(): return render_template('student_results.html')
@app.route("/create_test.html")
def create_test_page(): return render_template('create_test.html')

@app.route("/api/student/login", methods=["POST"])
def login_student():
    data = request.get_json()
    student = users_collection.find_one({"user_id": data.get("studentId"), "full_name": data.get("fullName"), "role": "student"})
    if student:
        session['user_id'] = student['user_id']
        session['user_name'] = student['full_name']
        return jsonify({"status": "success"}), 200
    return jsonify({"status": "error", "message": "Invalid credentials"}), 401

@app.route("/api/student/dashboard", methods=["GET"])
def get_student_dashboard():
    if 'user_id' not in session: return jsonify({"status": "error", "message": "Unauthorized"}), 401
    student_id = session['user_id']
    dummy_test = tests_collection.find_one({"test_id": "dummy-test-01"})
    all_other_tests = list(tests_collection.find({"test_id": {"$ne": "dummy-test-01"}}))
    tests_dict = {test['test_id']: test for test in all_other_tests}
    student_submissions = list(submissions_collection.find({"student_id": student_id}))
    completed_test_ids = {sub['test_id'] for sub in student_submissions}
    available_exams, upcoming_exams, completed_exams = [], [], []
    now = datetime.datetime.now(datetime.timezone.utc)
    for sub in student_submissions:
        test_info = tests_dict.get(sub['test_id'])
        if test_info:
            completed_test = test_info.copy()
            completed_test['submission_id'] = sub['session_id']
            completed_test['submission_time'] = sub.get('end_time')  # Add submission time for 24-hour check
            completed_exams.append(completed_test)
    for test in all_other_tests:
        if test['test_id'] not in completed_test_ids:
            scheduled_time = test.get('scheduled_datetime')
            if scheduled_time and scheduled_time.tzinfo is None:
                scheduled_time = scheduled_time.replace(tzinfo=datetime.timezone.utc)
            if scheduled_time and now < scheduled_time:
                upcoming_exams.append(test)
            else:
                available_exams.append(test)
    if dummy_test:
        available_exams.insert(0, dummy_test)
    dashboard_data = { "status": "success", "student_name": session.get('user_name'), "exams": { "available": available_exams, "upcoming": upcoming_exams, "completed": completed_exams } }
    return jsonify(json.loads(json.dumps(dashboard_data, default=mongo_serializer)))

@app.route("/api/exam/details/<test_id>", methods=["GET"])
def get_exam_details(test_id):
    test = tests_collection.find_one({"test_id": test_id}, {"_id": 0})
    if test: return jsonify({"status": "success", "details": json.loads(json.dumps(test, default=mongo_serializer))})
    return jsonify({"status": "error", "message": "Test not found"}), 404

@app.route("/api/exam/start", methods=["POST"])
def start_exam_session():
    data = request.get_json()
    session_id = str(uuid.uuid4())
    new_submission = {"session_id": session_id, "student_id": data.get('student_id'), "test_id": data.get('test_id'), "start_time": datetime.datetime.utcnow(), "status": "active", "answers": [], "logs": []}
    submissions_collection.insert_one(new_submission)
    print(f"SUCCESS: New submission created with session_id: {session_id}")
    return jsonify({"status": "success", "session_id": session_id}), 201

@app.route('/api/exam/submit', methods=['POST'])
def submit_exam():
    data = request.get_json()
    session_id = data.get('session_id')
    answers = data.get('answers')
    if not session_id or answers is None: return jsonify({"status": "error", "message": "Missing data."}), 400
    result = submissions_collection.update_one(
        {"session_id": session_id, "status": "active"},
        {"$set": {"status": "completed", "answers": answers, "end_time": datetime.datetime.utcnow()}}
    )
    if result.modified_count > 0: return jsonify({"status": "success"}), 200
    return jsonify({"status": "error", "message": "Session not found or already completed."}), 404

@app.route("/api/submission/summary/<session_id>", methods=["GET"])
def get_submission_summary(session_id):
    submission = submissions_collection.find_one({"session_id": session_id})
    if not submission: return jsonify({"status": "error", "message": "Submission not found"}), 404
    test = tests_collection.find_one({"test_id": submission.get("test_id")})
    utc_end_time = submission.get("end_time")
    ist_end_time = None
    if utc_end_time:
        ist_tz = datetime.timezone(datetime.timedelta(hours=5, minutes=30))
        ist_end_time = utc_end_time.replace(tzinfo=datetime.timezone.utc).astimezone(ist_tz)
    summary_data = {
        "exam_name": test.get("name", "N/A") if test else "N/A", "end_time": ist_end_time,
        "questions_attempted": len([ans for ans in submission.get("answers", []) if ans.get("answer") is not None]),
        "total_questions": len(test.get("questions", [])) if test else 0,
        "warnings": len([log for log in submission.get("logs", []) if log.get("type") == "warning"])
    }
    return jsonify({"status": "success", "summary": json.loads(json.dumps(summary_data, default=mongo_serializer))})

@app.route("/upload-selfie", methods=["POST"])
def upload_selfie():
    data = request.get_json()
    filepath = save_base64_image(data.get("selfie"), UPLOAD_FOLDER, f"selfie_{data.get('session_id')}")
    if filepath:
        submissions_collection.update_one({"session_id": data.get('session_id')}, {"$set": {"selfie_path": filepath}})
        return jsonify({"status": "success"}), 200
    return jsonify({"status": "error", "message": "Failed to save selfie"}), 500

@app.route("/api/log_event", methods=["POST"])
def log_event():
    data = request.get_json()
    log_entry = {"timestamp": datetime.datetime.utcnow(), "type": data.get("log_type", "info"), "message": data.get("log_message")}
    result = submissions_collection.update_one({"session_id": data.get("session_id")}, {"$push": {"logs": log_entry}})
    if result.modified_count > 0: return jsonify({"status": "ok"}), 200
    return jsonify({"status": "error", "message": "Session not found"}), 404

@app.route("/api/exam/violation", methods=["POST"])
def log_exam_violation():
    """Log exam violations and handle exam locking"""
    data = request.get_json()
    session_id = data.get('session_id')
    violation_type = data.get('type')
    reason = data.get('reason')
    timestamp = data.get('timestamp')
    tab_switch_count = data.get('tabSwitchCount', 0)
    multi_face_detected = data.get('multiFaceDetected', False)
    
    if session_id and violation_type:
        # Log the violation
        violation_log = {
            "event_type": "exam_violation",
            "violation_type": violation_type,
            "reason": reason,
            "timestamp": datetime.datetime.utcnow(),
            "tab_switch_count": tab_switch_count,
            "multi_face_detected": multi_face_detected,
            "exam_locked": True
        }
        
        # Update submission with violation and mark as locked
        submissions_collection.update_one(
            {"session_id": session_id},
            {
                "$push": {"logs": violation_log},
                "$set": {
                    "exam_locked": True,
                    "lock_reason": reason,
                    "lock_timestamp": datetime.datetime.utcnow()
                }
            }
        )
        
        print(f"Exam locked for session {session_id}: {reason}")
        return jsonify({"status": "success", "message": "Violation logged and exam locked"})
    
    return jsonify({"status": "error", "message": "Invalid violation data"}), 400

@app.route("/api/admin/login", methods=["POST"])
def admin_login():
    data = request.get_json()
    admin = users_collection.find_one({"user_id": data.get("email"), "role": "admin", "password": data.get("password")})
    if admin:
        session['admin_logged_in'] = True
        return jsonify({"status": "success"}), 200
    return jsonify({"status": "error", "message": "Invalid credentials"}), 401

@app.route("/api/admin/summary", methods=["GET"])
def get_admin_summary():
    active_sessions_count = submissions_collection.count_documents({"status": "active"})
    pipeline = [{"$match": {"status": "active"}}, {"$project": {"alerts_count": {"$size": "$logs"}}}, {"$group": {"_id": None, "total_alerts": {"$sum": "$alerts_count"}}}]
    alerts_result = list(submissions_collection.aggregate(pipeline))
    pending_alerts_count = alerts_result[0]['total_alerts'] if alerts_result else 0
    return jsonify({ "status": "success", "activeSessions": active_sessions_count, "pendingAlerts": pending_alerts_count })

@app.route("/api/admin/exams", methods=["GET"])
def get_exam_options():
    exams_cursor = tests_collection.find({}, {"_id": 0, "test_id": 1, "name": 1})
    exams_list = [{"id": exam['test_id'], "name": exam['name']} for exam in exams_cursor]
    return jsonify({"status": "success", "exams": exams_list})

@app.route("/api/admin/sessions", methods=["GET"])
def get_admin_sessions():
    if not session.get('admin_logged_in'):
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    
    course_id = request.args.get('courseId', '')
    query = {"status": "active"}
    if course_id:
        query["test_id"] = course_id
    
    submissions = list(submissions_collection.find(query).sort("start_time", -1))
    tests = list(tests_collection.find())
    users = list(users_collection.find())
    
    tests_dict = {test['test_id']: test for test in tests}
    users_dict = {user['user_id']: user for user in users}
    
    sessions_list = []
    for sub in submissions:
        test_info = tests_dict.get(sub.get("test_id"))
        student_info = users_dict.get(sub.get("student_id"))
        if test_info and student_info:
            start_time = sub.get("start_time")
            time_str = start_time.strftime("%H:%M") if start_time else "N/A"
            sessions_list.append({
                "id": sub.get("session_id"),
                "studentName": student_info.get("full_name", "N/A"),
                "examName": test_info.get("name", "N/A"),
                "status": sub.get("status", "active"),
                "time": time_str
            })
    
    return jsonify({"status": "success", "sessions": sessions_list})

@app.route("/api/admin/session/<session_id>", methods=["GET"])
def get_admin_session_details(session_id):
    if not session.get('admin_logged_in'):
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    
    submission = submissions_collection.find_one({"session_id": session_id})
    if not submission:
        return jsonify({"status": "error", "message": "Session not found"}), 404
    
    test = tests_collection.find_one({"test_id": submission.get("test_id")})
    user = users_collection.find_one({"user_id": submission.get("student_id")})
    
    if not test or not user:
        return jsonify({"status": "error", "message": "Data not found"}), 404
    
    start_time = submission.get("start_time")
    end_time = submission.get("end_time")
    
    details = {
        "studentName": user.get("full_name", "N/A"),
        "studentId": user.get("user_id", "N/A"),
        "examName": test.get("name", "N/A"),
        "examCode": test.get("code", "N/A"),
        "startTime": start_time.strftime("%Y-%m-%d %H:%M:%S") if start_time else "N/A",
        "endTime": end_time.strftime("%Y-%m-%d %H:%M:%S") if end_time else "N/A",
        "status": submission.get("status", "active"),
        "alerts": submission.get("logs", []),
        "downloadLinks": []  # Placeholder for future file downloads
    }
    
    return jsonify({"status": "success", "details": details})

@app.route("/api/admin/export-all-logs-csv", methods=["GET"])
def export_all_logs_csv():
    if not session.get('admin_logged_in'):
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    
    try:
        submissions = list(submissions_collection.find({"status": "completed"}))
        tests = list(tests_collection.find())
        users = list(users_collection.find())
        
        tests_dict = {test['test_id']: test for test in tests}
        users_dict = {user['user_id']: user for user in users}
        
        # Create CSV content
        csv_content = "Session ID,Student Name,Student ID,Exam Name,Start Time,End Time,Warning Count,Log Details\n"
        
        for sub in submissions:
            test_info = tests_dict.get(sub.get("test_id"))
            student_info = users_dict.get(sub.get("student_id"))
            
            if test_info and student_info:
                session_id = sub.get("session_id", "")
                student_name = student_info.get("full_name", "N/A")
                student_id = student_info.get("user_id", "N/A")
                exam_name = test_info.get("name", "N/A")
                start_time = sub.get("start_time", "")
                end_time = sub.get("end_time", "")
                warning_count = len([log for log in sub.get("logs", []) if log.get("type") == "warning"])
                log_details = "; ".join([f"{log.get('message', '')}" for log in sub.get("logs", [])])
                
                csv_content += f'"{session_id}","{student_name}","{student_id}","{exam_name}","{start_time}","{end_time}","{warning_count}","{log_details}"\n'
        
        from io import StringIO
        output = StringIO()
        output.write(csv_content)
        output.seek(0)
        
        from flask import Response
        return Response(
            output.getvalue(),
            mimetype="text/csv",
            headers={"Content-Disposition": "attachment;filename=all_proctoring_logs.csv"}
        )
    except Exception as e:
        print(f"ERROR: Failed to export logs: {e}")
        return jsonify({"status": "error", "message": "Failed to export logs"}), 500

# --- UPDATED ADMIN SUBMISSIONS ENDPOINT WITH GRADING ---
@app.route("/api/admin/submissions", methods=["GET"])
def get_all_submissions():
    submissions = list(submissions_collection.find({"status": "completed"}).sort("start_time", -1))
    tests = list(tests_collection.find())
    users = list(users_collection.find())
    tests_dict = {test['test_id']: test for test in tests}
    users_dict = {user['user_id']: user for user in users}
    results = []
    for sub in submissions:
        test_info = tests_dict.get(sub.get("test_id"))
        student_info = users_dict.get(sub.get("student_id"))
        if not test_info or not student_info: continue
        score, mcq_count, graded_answers = 0, 0, []
        test_questions = {q['text']: q for q in test_info.get('questions', [])}
        for student_answer in sub.get('answers', []):
            q_text = student_answer.get('question_text')
            s_answer = student_answer.get('answer')
            question_details = test_questions.get(q_text)
            status = 'pending'
            if question_details and question_details.get('type') == 'mcq':
                mcq_count += 1
                correct_answer = question_details.get('answer')
                if s_answer == correct_answer:
                    score += 1
                    status = 'correct'
                else:
                    status = 'incorrect'
            graded_answers.append({"question_text": q_text, "answer": s_answer, "status": status})
        final_score_str = f"{score}/{mcq_count}" if mcq_count > 0 else "N/A"
        results.append({
            "session_id": sub.get("session_id"), "student_id": sub.get("student_id"), "test_id": sub.get("test_id"),
            "start_time": sub.get("start_time"), "student_name": student_info.get("full_name", "N/A"),
            "exam_name": test_info.get("name", "N/A"), "logs": sub.get("logs", []),
            "answers": graded_answers, "score": final_score_str
        })
    return jsonify({"status": "success", "submissions": json.loads(json.dumps(results, default=mongo_serializer))})

@app.route("/api/admin/create_test", methods=["POST"])
def create_test():
    data = request.get_json()
    title = data.get('title')
    duration_str = data.get('duration')
    questions = data.get('questions', [])
    if not title or not duration_str:
        return jsonify({"status": "error", "message": "Title and Duration are required."}), 400
    try:
        duration_minutes = int(duration_str)
        if duration_minutes <= 0: raise ValueError()
    except (ValueError, TypeError):
        return jsonify({"status": "error", "message": "Duration must be a positive number."}), 400
    for q in questions:
        if q.get('type') == 'mcq' and 'answer' not in q:
            return jsonify({"status": "error", "message": "A correct answer must be selected for all MCQ questions."}), 400
    test_id = str(uuid.uuid4())[:8]
    code_from_title = "".join([word[0].upper() for word in title.split()]) if title else "TEST"
    new_test = {
        "test_id": test_id, "name": title, "code": f"{code_from_title}-{test_id[:4].upper()}",
        "duration_seconds": duration_minutes * 60, "questions": questions, "created_at": datetime.datetime.utcnow()
    }
    scheduled_time_str = data.get('scheduled_datetime')
    if scheduled_time_str:
        try:
            new_test['scheduled_datetime'] = datetime.datetime.fromisoformat(scheduled_time_str.replace('Z', '+00:00'))
        except (ValueError, TypeError):
            return jsonify({"status": "error", "message": "Invalid datetime format for schedule."}), 400
    tests_collection.insert_one(new_test)
    print(f"SUCCESS: Test '{title}' created and saved to database.")
    return jsonify({"status": "success", "message": "Test created successfully!"}), 201

@app.route("/api/admin/test/<test_id>", methods=['DELETE'])
def delete_test(test_id):
    if 'admin_logged_in' not in session:
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    if test_id == "dummy-test-01":
        return jsonify({"status": "error", "message": "Cannot delete the sample test."}), 403
    test_deletion_result = tests_collection.delete_one({"test_id": test_id})
    if test_deletion_result.deleted_count > 0:
        submission_deletion_result = submissions_collection.delete_many({"test_id": test_id})
        print(f"Deleted test {test_id} and {submission_deletion_result.deleted_count} associated submissions.")
        return jsonify({"status": "success", "message": f"Test and {submission_deletion_result.deleted_count} submissions deleted."}), 200
    else:
        return jsonify({"status": "error", "message": "Test not found."}), 404

@app.route("/api/student/results/<session_id>", methods=["GET"])
def get_student_results(session_id):
    # Ensure the user is logged in and is the owner of the session
    if 'user_id' not in session:
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    student_id = session['user_id']
    submission = submissions_collection.find_one({"session_id": session_id})
    if not submission:
        return jsonify({"status": "error", "message": "Submission not found"}), 404
    if submission.get("student_id") != student_id:
        return jsonify({"status": "error", "message": "Forbidden"}), 403
    
    # Check if 24 hours have passed since submission
    submission_time = submission.get("end_time")
    if not submission_time:
        return jsonify({"status": "error", "message": "Submission time not found"}), 404
    
    current_time = datetime.datetime.utcnow()
    time_difference = current_time - submission_time
    hours_passed = time_difference.total_seconds() / 3600
    
    if hours_passed < 24:
        # Calculate remaining time
        remaining_hours = 24 - hours_passed
        remaining_minutes = int((remaining_hours % 1) * 60)
        remaining_hours = int(remaining_hours)
        
        return jsonify({
            "status": "pending",
            "message": "Results will be available in 24 hours after submission",
            "remaining_time": {
                "hours": remaining_hours,
                "minutes": remaining_minutes
            },
            "submission_time": submission_time.isoformat(),
            "available_time": (submission_time + datetime.timedelta(hours=24)).isoformat()
        }), 200
    
    # Results are available - proceed with grading
    test = tests_collection.find_one({"test_id": submission.get("test_id")})
    user = users_collection.find_one({"user_id": student_id})
    if not test or not user:
        return jsonify({"status": "error", "message": "Data not found"}), 404
    
    # Grading logic (similar to admin)
    score, mcq_count, graded_answers = 0, 0, []
    test_questions = {q['text']: q for q in test.get('questions', [])}
    for student_answer in submission.get('answers', []):
        q_text = student_answer.get('question_text')
        s_answer = student_answer.get('answer')
        question_details = test_questions.get(q_text)
        status = 'pending'
        correct_answer = None
        q_type = question_details.get('type') if question_details else 'subjective'
        if question_details and q_type == 'mcq':
            mcq_count += 1
            correct_answer = question_details.get('answer')
            if s_answer == correct_answer:
                score += 1
                status = 'correct'
            else:
                status = 'incorrect'
        graded_answers.append({
            "question_text": q_text,
            "answer": s_answer,
            "type": q_type,
            "status": status,
            "correct_answer": correct_answer if (q_type == 'mcq' and status == 'incorrect') else None
        })
    final_score_str = f"{score}/{mcq_count}" if mcq_count > 0 else "N/A"
    result = {
        "status": "success",
        "exam_name": test.get("name", "N/A"),
        "exam_code": test.get("code", "N/A"),
        "student_name": user.get("full_name", "N/A"),
        "score": final_score_str,
        "answers": graded_answers,
        "submission_time": submission_time.isoformat(),
        "results_available_time": (submission_time + datetime.timedelta(hours=24)).isoformat()
    }
    return jsonify(result)

@app.route("/api/admin/review/<session_id>", methods=["GET"])
def admin_review_submission(session_id):
    if not session.get('admin_logged_in'):
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    submission = submissions_collection.find_one({"session_id": session_id})
    if not submission:
        return jsonify({"status": "error", "message": "Submission not found"}), 404
    test = tests_collection.find_one({"test_id": submission.get("test_id")})
    user = users_collection.find_one({"user_id": submission.get("student_id")})
    if not test or not user:
        return jsonify({"status": "error", "message": "Data not found"}), 404
    # Grading logic (same as student/admin)
    score, mcq_count, graded_answers = 0, 0, []
    test_questions = {q['text']: q for q in test.get('questions', [])}
    for student_answer in submission.get('answers', []):
        q_text = student_answer.get('question_text')
        s_answer = student_answer.get('answer')
        question_details = test_questions.get(q_text)
        status = 'pending'
        correct_answer = None
        q_type = question_details.get('type') if question_details else 'subjective'
        if question_details and q_type == 'mcq':
            mcq_count += 1
            correct_answer = question_details.get('answer')
            if s_answer == correct_answer:
                score += 1
                status = 'correct'
            else:
                status = 'incorrect'
        graded_answers.append({
            "question_text": q_text,
            "answer": s_answer,
            "type": q_type,
            "status": status,
            "correct_answer": correct_answer if (q_type == 'mcq' and status == 'incorrect') else None
        })
    final_score_str = f"{score}/{mcq_count}" if mcq_count > 0 else "N/A"
    selfie_path = submission.get('selfie_path')
    # If selfie_path exists, make it accessible from frontend (strip backend/ if needed)
    if selfie_path and selfie_path.startswith('backend/'):
        selfie_path = selfie_path.replace('backend/', '../backend/')
    result = {
        "status": "success",
        "exam_name": test.get("name", "N/A"),
        "exam_code": test.get("code", "N/A"),
        "student_name": user.get("full_name", "N/A"),
        "student_id": user.get("user_id", "N/A"),
        "score": final_score_str,
        "selfie_path": selfie_path,
        "answers": graded_answers,
        "logs": submission.get('logs', [])
    }
    return jsonify(result)

@app.route("/api/admin/students", methods=["POST"])
def create_student():
    if not session.get('admin_logged_in'):
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    data = request.get_json()
    student_id = data.get('student_id')
    full_name = data.get('full_name')
    email = data.get('email', '')
    
    if not student_id or not full_name:
        return jsonify({"status": "error", "message": "Student ID and Full Name are required"}), 400
    
    # Check if student already exists
    existing_student = users_collection.find_one({"user_id": student_id})
    if existing_student:
        return jsonify({"status": "error", "message": "Student ID already exists"}), 409
    
    # Create new student
    new_student = {
        "user_id": student_id,
        "full_name": full_name,
        "email": email,
        "role": "student",
        "created_at": datetime.datetime.utcnow()
    }
    
    try:
        users_collection.insert_one(new_student)
        print(f"SUCCESS: Student '{full_name}' (ID: {student_id}) created successfully.")
        return jsonify({"status": "success", "message": f"Student {full_name} created successfully!"}), 201
    except Exception as e:
        print(f"ERROR: Failed to create student: {e}")
        return jsonify({"status": "error", "message": "Failed to create student"}), 500

@app.route("/api/admin/students", methods=["GET"])
def get_all_students():
    if not session.get('admin_logged_in'):
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    
    try:
        students = list(users_collection.find({"role": "student"}, {"_id": 0, "password": 0}))
        return jsonify({"status": "success", "students": json.loads(json.dumps(students, default=mongo_serializer))})
    except Exception as e:
        print(f"ERROR: Failed to fetch students: {e}")
        return jsonify({"status": "error", "message": "Failed to fetch students"}), 500

@app.route("/api/admin/students/<student_id>", methods=["DELETE"])
def delete_student(student_id):
    if not session.get('admin_logged_in'):
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    
    # Check if student exists
    student = users_collection.find_one({"user_id": student_id, "role": "student"})
    if not student:
        return jsonify({"status": "error", "message": "Student not found"}), 404
    
    try:
        # Delete student's submissions first
        submissions_deleted = submissions_collection.delete_many({"student_id": student_id})
        
        # Delete the student
        users_collection.delete_one({"user_id": student_id, "role": "student"})
        
        print(f"SUCCESS: Student '{student.get('full_name')}' (ID: {student_id}) and {submissions_deleted.deleted_count} submissions deleted.")
        return jsonify({
            "status": "success", 
            "message": f"Student {student.get('full_name')} and {submissions_deleted.deleted_count} submissions deleted successfully!"
        }), 200
    except Exception as e:
        print(f"ERROR: Failed to delete student: {e}")
        return jsonify({"status": "error", "message": "Failed to delete student"}), 500

@app.route("/api/student/logout", methods=["POST"])
def student_logout():
    session.pop('user_id', None)
    session.pop('user_name', None)
    return jsonify({"status": "success", "message": "Logged out successfully"})

@app.route("/api/admin/logout", methods=["POST"])
def admin_logout():
    session.pop('admin_logged_in', None)
    return jsonify({"status": "success", "message": "Logged out successfully"})

if __name__ == "__main__":
    app.run(debug=True, port=5000)