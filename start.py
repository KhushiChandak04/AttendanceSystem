import tkinter as tk
import cv2
import os
from tkinter.simpledialog import askstring
import subprocess
import sys

def run_face_scan():
    subprocess.Popen([sys.executable, "Face_Rec.py"])

def run_exit_scan():
    subprocess.Popen([sys.executable, "test.py"])

def capture_new_face():
    cap = cv2.VideoCapture(0)
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    
    name = askstring("Enter Name", "Enter the name for this person:\nEnter Your Name with this format\nRoll.no_Name Surname\nExample: 46_Meet Shah")
    if not name:
        return

    while True:
        ret, frame = cap.read()
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5)

        for (x, y, w, h) in faces:
            roi_gray = gray[y:y+h, x:x+w]
            cv2.imshow('Face', roi_gray)
            cv2.waitKey(1000)
            cv2.destroyAllWindows()
            
            image_path = os.path.join("images", f"{name}.jpg")
            cv2.imwrite(image_path, roi_gray)
            break

        if len(faces) > 0:
            break

    cap.release()

root = tk.Tk()
root.title("Attendance System")
root.geometry("800x400")  # Set the initial size of the window

heading_label = tk.Label(root, text="Face Recognition Attendance System", font=("Helvetica", 20, "bold"))
heading_label.pack(pady=20)

left_frame = tk.Frame(root, width=400, height=400, bg="lightblue")
left_frame.pack(side="left", fill="both", expand=True)

right_frame = tk.Frame(root, width=400, height=400, bg="lightblue")
right_frame.pack(side="right", fill="both", expand=True)

scan_button = tk.Button(left_frame, text="Scan Face (Entry)", command=run_face_scan)
scan_button.pack(pady=20, anchor="center")

exit_button = tk.Button(left_frame, text="Scan Face (Exit)", command=run_exit_scan,)
exit_button.pack(pady=20, anchor="center")

new_registration_button = tk.Button(left_frame, text="New Registration", command=capture_new_face)
new_registration_button.pack(pady=20, anchor="center")

info_label = tk.Label(right_frame, text="Instructions:\n\n1. Click 'Scan Face (Entry)' to run face scanning during entry.\n2. Click 'Scan Face (Exit)' to run face scanning during exit.\n3. Click 'New Registration' to capture and register a new face.\n4. Point your eyes towards the Camera Correctly.\n5. Make sure your face has been scanned correctly.\n6. Make sure no one comes behind you when you are scanning your face.", justify="left",bg="lightblue")
info_label.pack(padx=20, pady=20)

root.mainloop()