from flask import Flask, request, jsonify
import firebase_admin
from firebase_admin import credentials, firestore
from sentence_transformers import SentenceTransformer, util
import datetime
from collections import defaultdict
from flask_cors import CORS
from datetime import datetime as dt, timedelta

# Initialize Firebase
cred = credentials.Certificate("Enter your crendentials here")
firebase_admin.initialize_app(cred)
db = firestore.client()

# Load semantic similarity model
model = SentenceTransformer('all-MiniLM-L6-v2')

app = Flask(__name__)
CORS(app)


@app.route("/suggest_schedule", methods=["POST"])
def suggest_schedule():
    data = request.get_json()

    event_name = data.get("event_name")
    event_description = data.get("event_description")
    event_interests = data.get("interests", [])
    volunteers_needed = int(data.get("volunteers_needed", 1))

    if not event_interests or volunteers_needed <= 0:
        return jsonify({"message": "Invalid interests or volunteers_needed"}), 400

    volunteers_ref = db.collection("volunteers")
    volunteers_docs = volunteers_ref.stream()

    availability = defaultdict(lambda: defaultdict(list))
    volunteer_names = {}

    event_vector = model.encode(" ".join(event_interests), convert_to_tensor=True)

    for doc in volunteers_docs:
        volunteer = doc.to_dict()
        volunteer_id = doc.id
        name = volunteer.get("name", "Unknown")
        volunteer_names[volunteer_id] = name

        volunteer_interests = volunteer.get("interests", [])
        available_days = volunteer.get("availableDay", [])
        available_times = volunteer.get("availableTime", [])

        if not volunteer_interests or not available_days or not available_times:
            continue

        volunteer_vector = model.encode(" ".join(volunteer_interests), convert_to_tensor=True)
        similarity = util.cos_sim(event_vector, volunteer_vector).item()
        print(f"{name} similarity: {similarity:.4f}")

        if similarity > 0.0:
            for day in available_days:
                for time in available_times:
                    print(f"{name}'s available day: {day}, time: {time}")
                    availability[day.lower()][time.strip()].append(volunteer_id)

    # Debug: Show what's inside availability
    print("\n======= Availability Dictionary =======")
    for day, slots in availability.items():
        for time, vlist in slots.items():
            names = [volunteer_names.get(v, "Unknown") for v in vlist]
            print(f"{day.title()} - {time} -> {len(vlist)} volunteers: {names}")
    print("=======================================\n")

    best_day = None
    best_slot = None
    best_volunteers = []
    max_volunteers = 0

    weekday_to_index = {
        "monday": 0, "tuesday": 1, "wednesday": 2,
        "thursday": 3, "friday": 4, "saturday": 5, "sunday": 6
    }

    today = dt.today().date()
    today_index = today.weekday()

    for day, slots in availability.items():
        day_index = weekday_to_index.get(day.lower(), -1)
        if day_index == -1:
            continue
        if day_index == today_index:
            continue

        for time, volunteer_list in slots.items():
            print(f"Checking {day} at {time}: {len(volunteer_list)} volunteers")
            if len(volunteer_list) >= volunteers_needed and len(volunteer_list) > max_volunteers:
                best_day = day
                best_slot = time
                best_volunteers = volunteer_list[:volunteers_needed]
                max_volunteers = len(volunteer_list)

    if best_day and best_slot:
        print(f"\nBest day: {best_day}, Best time: {best_slot}")
        print("Selected Volunteer IDs:", best_volunteers)
        selected_names = [volunteer_names.get(vid, "Unknown") for vid in best_volunteers]
        print("Selected Volunteer Names:", selected_names)

        target_index = weekday_to_index.get(best_day.lower())
        days_ahead = (target_index - today_index + 7) % 7
        suggested_date = today + timedelta(days=days_ahead)

        return jsonify({
            "date": suggested_date.isoformat(),
            "timeSlot": best_slot,
            "volunteer_names": selected_names
        })

    return jsonify({"message": "No suitable schedule found."}), 404


if __name__ == '__main__':
    app.run(debug=True)
