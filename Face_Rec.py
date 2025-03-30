import cv2 #video capture
import numpy as np # frame 
import face_recognition
import os #file access 
from datetime import datetime 

path = 'images'
images = []
personNames = []
myList = os.listdir(path)
#print(myList)
for cu_img in myList:
    current_Img = cv2.imread(f'{path}/{cu_img}')
    images.append(current_Img)
    personNames.append(os.path.splitext(cu_img)[0])
print(personNames)

# Face Recognition Code: Converting image from BGR to RGB
def faceEncodings(images):
    encodeList = []
    # print(images[1])
    for img in images:
        
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        encode = face_recognition.face_encodings(img)[0]
        encodeList.append(encode)
    
    return encodeList

# It is for storing Recognized Face data in .csv(Excel Sheet) file
def attendance(name):
    with open('Attendance.csv', 'r+') as f: # Opening .csv File.
        myDataList = f.readlines()
        nameList = []
        for line in myDataList:
            entry = line.split(',') # This will separate names by column
            nameList.append(entry[0]) # Adding entry nameList from [0]th position
            
            # This is to store data in .csv file without duplicating any info.
        if name not in nameList:
            time_now = datetime.now()
            tStr = time_now.strftime('%H:%M:%S')
            dStr = time_now.strftime('%d/%m/%Y')
            f.writelines(f'\n{name},{tStr},{dStr}')
            f.close()


encodeListKnown = faceEncodings(images) # Calling faceEncoding Function
print('All Encodings Complete!!!')

# This is used to access camera for capturing image
print("Capturing face")
cap = cv2.VideoCapture(0)

# this is used for creating frame for video capture.
while True:
    ret, frame = cap.read() #reading Captured Video
    # print(ret, frame)
    faces = cv2.resize(frame, (0, 0), None, 0.25, 0.25)
    faces = cv2.cvtColor(faces, cv2.COLOR_BGR2RGB)

    facesCurrentFrame = face_recognition.face_locations(faces)
    encodesCurrentFrame = face_recognition.face_encodings(faces, facesCurrentFrame)

    for encodeFace, faceLoc in zip(encodesCurrentFrame, facesCurrentFrame):
        matches = face_recognition.compare_faces(encodeListKnown, encodeFace)
        # print(matches)
        faceDis = face_recognition.face_distance(encodeListKnown, encodeFace)
        # print(faceDis)
        matchIndex = np.argmin(faceDis) #  This is used give Cordinates.
        

        # This is used to display name after recognizing someone
        if matches[matchIndex]:
            name = personNames[matchIndex].upper()
            # print(name)
            y1, x2, y2, x1 = faceLoc
            y1, x2, y2, x1 = y1 * 4, x2 * 4, y2 * 4, x1 * 4
            #The function cv::rectangle draws a rectangle outline or a 
            # filled rectangle whose two opposite corners are pt1 and pt2.
            cv2.putText(frame,name, (x1 + 6, y2 - 20), cv2.FONT_HERSHEY_COMPLEX, 1, (250, 250, 250), 4)
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            # cv2.rectangle(frame, (x1, y2 - 35), (x2, y2), (0, 255, 0))
            attendance(name)

    # The function imshow displays an image in the specified window.
    cv2.imshow('Camera', frame)
    if cv2.waitKey(1) == 13: # It is used to exit the window by pressing 'Enter' key
        break

cap.release() # release: Any
cv2.destroyAllWindows() #The function destroyAllWindows destroys all of the opened HighGUI windows.