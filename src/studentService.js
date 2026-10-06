
import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp
} from "firebase/firestore";

import { db, auth } from "./firebase.jsx";

const studentsCollection = collection(db, "students");

function getVerifiedUser() {
  const user = auth.currentUser;

  if (!user || !user.emailVerified) {
    throw new Error("Please sign in with your verified email first.");
  }

  return user;
}

export async function addStudent(student) {
  const user = getVerifiedUser();

  const name = String(student.name ?? "").trim();
  const className = String(student.className ?? "").trim();
  const attendance = Number(student.attendance);
  const performance = Number(student.performance);

  if (!name || !className) {
    throw new Error("Student name and class are required.");
  }

  if (
    !Number.isFinite(attendance) ||
    attendance < 0 ||
    attendance > 100
  ) {
    throw new Error("Attendance must be between 0 and 100.");
  }

  if (
    !Number.isFinite(performance) ||
    performance < 0 ||
    performance > 100
  ) {
    throw new Error("Performance must be between 0 and 100.");
  }

  const studentData = {
    name,
    className,
    attendance,
    performance,
    ownerUid: user.uid,
    createdAt: serverTimestamp()
  };

  const docRef = await addDoc(studentsCollection, studentData);

  return {
    id: docRef.id,
    name,
    className,
    attendance,
    performance
  };
}

export async function getStudents() {
  const user = getVerifiedUser();

  const studentsQuery = query(
    studentsCollection,
    where("ownerUid", "==", user.uid),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(studentsQuery);

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data()
  }));
}
