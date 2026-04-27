import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  EarOff,
  MicOff,
  EyeOff,
  Search,
  BookOpen,
  Activity,
  Bell,
  Settings,
  MoreVertical,
  UserCircle,
  Calendar,
  Clock,
  Video,
  FileText,
  ClipboardList,
  LogOut,
  LogIn,
  Plus,
  X
} from 'lucide-react';
import { auth, db, loginAnonymously, logout } from './firebase';
import { collection, onSnapshot, query, where, doc, setDoc, getDocs, getDocFromServer, serverTimestamp } from 'firebase/firestore';

import { handleFirestoreError, OperationType } from './firestore-error';

import LiveRecording from './LiveRecording';
import ContentUpload from './ContentUpload';
import AudioOverview from './AudioOverview';
import ToolsDirectory from './ToolsDirectory';

// Boot connection check
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

interface Student {
  id: string;
  teacherId: string;
  name: string;
  isHearingImpaired: boolean;
  isVisuallyImpaired: boolean;
  status: 'Online' | 'Offline' | 'In Class';
  lastActive: string;
  grade: string;
  createdAt: number;
  updatedAt: number;
}

interface Period {
  id: string;
  teacherId: string;
  time: string;
  subject: string;
  topic: string;
  book: string;
  materials: string[];
  videoRecorded: boolean;
  homework: string;
  date: string;
  createdAt: number;
  updatedAt: number;
}

const MOCK_STUDENTS = [
  { name: 'Alice Smith', isHearingImpaired: true, isVisuallyImpaired: false, status: 'In Class' as const, lastActive: 'Just now', grade: '10th Grade' },
  { name: 'Bob Jones', isHearingImpaired: false, isVisuallyImpaired: true, status: 'Online' as const, lastActive: '2 mins ago', grade: '9th Grade' },
  { name: 'Charlie Brown', isHearingImpaired: true, isVisuallyImpaired: true, status: 'Offline' as const, lastActive: '1 hr ago', grade: '10th Grade' },
  { name: 'Diana Prince', isHearingImpaired: true, isVisuallyImpaired: false, status: 'In Class' as const, lastActive: 'Just now', grade: '11th Grade' },
];

const TODAY_SCHEDULE = [
  { time: '09:00 AM - 10:30 AM', subject: 'Sign Language Basics', topic: 'Common Greetings & Phrases', book: 'ASL Beginner Edition, Ch 4', materials: ['Greeting Flashcards', 'Visual Diagram A'], videoRecorded: true, homework: 'Practice greetings with 3 family members or mirror, record a short clip.' },
  { time: '10:45 AM - 12:00 PM', subject: 'Mathematics', topic: 'Algebraic Expressions', book: 'Visual Math Grade 10, Pg 42', materials: ['Interactive Whiteboard Presentation', 'Math Blocks'], videoRecorded: true, homework: 'Complete exercises 1-15 on page 44.' },
];

import { UploadCloud, Headphones, Accessibility } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(auth.currentUser);
  const [currentTab, setCurrentTab] = useState<'students' | 'schedule' | 'live' | 'upload' | 'audio' | 'tools'>('schedule');

  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: '', grade: '10th Grade', isHearingImpaired: false, isVisuallyImpaired: false, status: 'Offline' as const
  });

  const [isAddScheduleModalOpen, setIsAddScheduleModalOpen] = useState(false);
  const [newPeriod, setNewPeriod] = useState({
    time: '', subject: '', topic: '', book: '', materials: '', homework: ''
  });

  const handleAddPeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPeriod.time.trim() || !newPeriod.subject.trim()) return;

    try {
      const newRef = doc(collection(db, 'periods'));
      await setDoc(newRef, {
        id: newRef.id,
        teacherId: user.uid,
        time: newPeriod.time,
        subject: newPeriod.subject,
        topic: newPeriod.topic,
        book: newPeriod.book,
        materials: newPeriod.materials ? newPeriod.materials.split(',').map(m => m.trim()) : [],
        videoRecorded: false,
        homework: newPeriod.homework,
        date: new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setIsAddScheduleModalOpen(false);
      setNewPeriod({ time: '', subject: '', topic: '', book: '', materials: '', homework: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'periods');
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newStudent.name.trim()) return;

    try {
      const newRef = doc(collection(db, 'students'));
      await setDoc(newRef, {
        ...newStudent,
        id: newRef.id,
        teacherId: user.uid,
        lastActive: 'Just now',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setIsAddModalOpen(false);
      setNewStudent({ name: '', grade: '10th Grade', isHearingImpaired: false, isVisuallyImpaired: false, status: 'Offline' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'students');
    }
  };

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (u) {
        setUser(u);
        // Initialize data if needed
        try {
          const sSnap = await getDocs(query(collection(db, 'students'), where('teacherId', '==', u.uid)));
          if (sSnap.empty) {
            for (let i = 0; i < MOCK_STUDENTS.length; i++) {
              const id = `student-${i}`;
              await setDoc(doc(db, 'students', id), {
                ...MOCK_STUDENTS[i],
                id,
                teacherId: u.uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
            }
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, 'students');
        }

        try {
          const pSnap = await getDocs(query(collection(db, 'periods'), where('teacherId', '==', u.uid)));
          if (pSnap.empty) {
            const date = new Date().toISOString().split('T')[0];
            for (let i = 0; i < TODAY_SCHEDULE.length; i++) {
              const id = `period-${i}`;
              await setDoc(doc(db, 'periods', id), {
                ...TODAY_SCHEDULE[i],
                id,
                teacherId: u.uid,
                date,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
            }
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, 'periods');
        }
      } else {
        loginAnonymously();
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    const qStudents = query(collection(db, 'students'), where('teacherId', '==', user.uid));
    const unsubStudents = onSnapshot(qStudents, (snap) => {
      setStudents(snap.docs.map(d => d.data() as Student));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'students'));

    const qPeriods = query(collection(db, 'periods'), where('teacherId', '==', user.uid));
    const unsubPeriods = onSnapshot(qPeriods, (snap) => {
      setPeriods(snap.docs.map(d => d.data() as Period));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'periods'));

    return () => { unsubStudents(); unsubPeriods(); };
  }, [user]);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => 
      student.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [students, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: students.length,
      deaf: students.filter(s => s.isHearingImpaired).length,
      mute: students.filter(s => s.isVisuallyImpaired).length,
      inClass: students.filter(s => s.status === 'In Class').length
    };
  }, [students]);

  if (!user) {
    return (
      <div className="flex h-screen bg-[#09090b] text-zinc-100 font-sans items-center justify-center">
        <div className="flex flex-col items-center">
           <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
           <p className="text-zinc-500 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#09090b] text-zinc-100 font-sans p-4 sm:p-8 overflow-hidden">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 border-b border-zinc-800 pb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/20">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Instructor Control Hub</h1>
            <p className="text-zinc-500 text-sm font-medium">Welcome, {user.displayName || 'Teacher'}</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Class Status</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-emerald-400 font-mono text-sm">ACTIVE</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-col md:flex-row flex-1 gap-8 min-h-0">
        
        {/* Sidebar Nav (elegant dark style) */}
        <aside className="w-full md:w-64 flex flex-col gap-2 shrink-0">
          <button 
            onClick={() => setCurrentTab('students')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${currentTab === 'students' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-zinc-500 bg-zinc-900/50 border border-transparent hover:bg-zinc-800/80 hover:text-zinc-300'}`}
          >
            <Users className="w-5 h-5" />
            Students View
          </button>
          <button 
            onClick={() => setCurrentTab('schedule')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${currentTab === 'schedule' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-zinc-500 bg-zinc-900/50 border border-transparent hover:bg-zinc-800/80 hover:text-zinc-300'}`}
          >
            <Calendar className="w-5 h-5" />
            Schedule
          </button>
          <button 
            onClick={() => setCurrentTab('live')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${currentTab === 'live' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-zinc-500 bg-zinc-900/50 border border-transparent hover:bg-zinc-800/80 hover:text-zinc-300'}`}
          >
            <Video className="w-5 h-5 ml-0.5" />
            Live Demo Tracker
          </button>
          <button 
            onClick={() => setCurrentTab('upload')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${currentTab === 'upload' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-zinc-500 bg-zinc-900/50 border border-transparent hover:bg-zinc-800/80 hover:text-zinc-300'}`}
          >
            <UploadCloud className="w-5 h-5 ml-0.5" />
            Content Upload
          </button>
          <button 
            onClick={() => setCurrentTab('audio')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${currentTab === 'audio' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-zinc-500 bg-zinc-900/50 border border-transparent hover:bg-zinc-800/80 hover:text-zinc-300'}`}
          >
            <Headphones className="w-5 h-5 ml-0.5" />
            Audio Overview
          </button>
          <button 
            onClick={() => setCurrentTab('tools')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${currentTab === 'tools' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-zinc-500 bg-zinc-900/50 border border-transparent hover:bg-zinc-800/80 hover:text-zinc-300'}`}
          >
            <Accessibility className="w-5 h-5 ml-0.5" />
            Accessibility Tools
          </button>
        </aside>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-y-auto pr-2">
          {currentTab === 'upload' ? (
            <ContentUpload />
          ) : currentTab === 'audio' ? (
             <AudioOverview />
          ) : currentTab === 'tools' ? (
             <ToolsDirectory />
          ) : currentTab === 'live' ? (
             <LiveRecording />
          ) : currentTab === 'schedule' ? (
            <div className="space-y-6 max-w-4xl">
              <div className="flex justify-between items-center mb-4">
                 <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full"></span> Today's Schedule
                 </h2>
                 <button 
                  onClick={() => setIsAddScheduleModalOpen(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-900/20"
                 >
                   <Plus className="w-4 h-4" /> Add Period
                 </button>
              </div>
              <div className="grid grid-cols-1 gap-6">
                {periods.map(period => (
                  <div key={period.id} className="flex flex-col sm:flex-row bg-zinc-900/40 border border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
                    <div className="bg-zinc-800/30 p-6 flex flex-col justify-center sm:w-64 shrink-0 border-b sm:border-b-0 sm:border-r border-zinc-800">
                       <Clock className="w-6 h-6 text-indigo-400 mb-2" />
                       <p className="font-bold text-zinc-100">{period.time}</p>
                       <span className="mt-2 text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-1 rounded-md self-start">
                         {period.subject}
                       </span>
                    </div>
                    <div className="p-6 flex-1 space-y-4">
                       <h4 className="text-lg font-semibold text-zinc-100">{period.topic}</h4>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-4">
                             <div className="flex items-start gap-3 text-sm">
                                <BookOpen className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
                                <div>
                                   <p className="font-semibold text-zinc-400 text-xs uppercase tracking-wider mb-1">Book / Resource</p>
                                   <p className="text-zinc-300">{period.book}</p>
                                </div>
                             </div>
                             <div className="flex items-start gap-3 text-sm">
                                <FileText className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
                                <div>
                                   <p className="font-semibold text-zinc-400 text-xs uppercase tracking-wider mb-1">Materials Used</p>
                                   <ul className="list-disc list-inside text-zinc-300">
                                      {period.materials.map((m, i) => <li key={i}>{m}</li>)}
                                   </ul>
                                </div>
                             </div>
                          </div>
                          <div className="space-y-4">
                             <div className="flex items-start gap-3 text-sm">
                                <Video className={`w-5 h-5 shrink-0 mt-0.5 ${period.videoRecorded ? 'text-red-400' : 'text-zinc-600'}`} />
                                <div>
                                   <p className="font-semibold text-zinc-400 text-xs uppercase tracking-wider mb-1">Recording</p>
                                   {period.videoRecorded ? (
                                     period.videoLink ? (
                                       <a href={period.videoLink} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors underline">View Recording</a>
                                     ) : (
                                       <div className="flex flex-col gap-2">
                                         <p className="text-zinc-300">Recorded</p>
                                         <button 
                                           onClick={async () => {
                                             const url = prompt('Enter recording URL:');
                                             if (url) {
                                               try {
                                                 await setDoc(doc(db, 'periods', period.id), { ...period, videoLink: url, updatedAt: serverTimestamp() });
                                               } catch (e) {
                                                 handleFirestoreError(e, OperationType.UPDATE, `periods/${period.id}`);
                                               }
                                             }
                                           }}
                                           className="text-xs px-2 py-1 bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700 transition"
                                         >
                                           Upload Link
                                         </button>
                                       </div>
                                     )
                                   ) : (
                                     <div className="flex gap-2 items-center">
                                       <p className="text-zinc-600 italic">No recording</p>
                                       <button 
                                         onClick={async () => {
                                           try {
                                             await setDoc(doc(db, 'periods', period.id), { ...period, videoRecorded: true, updatedAt: serverTimestamp() });
                                           } catch (e) {
                                             handleFirestoreError(e, OperationType.UPDATE, `periods/${period.id}`);
                                           }
                                         }}
                                         className="text-xs px-2 py-1 bg-zinc-800 text-zinc-400 hover:bg-zinc-700 rounded transition"
                                       >
                                         Mark Recorded
                                       </button>
                                     </div>
                                   )}
                                </div>
                             </div>
                             <div className="flex items-start gap-3 text-sm">
                                <ClipboardList className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                                <div>
                                   <p className="font-semibold text-zinc-400 text-xs uppercase tracking-wider mb-1">Homework</p>
                                   <p className="text-zinc-300">{period.homework}</p>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
                ))}
                {periods.length === 0 && (
                   <p className="text-zinc-500 italic p-6">No periods scheduled for today.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <div className="relative w-full sm:w-80">
                   <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                   <input 
                     type="text" 
                     placeholder="Search students..." 
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-200 placeholder-zinc-500 transition-shadow"
                   />
                 </div>
                 <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-900/20"
                 >
                   <Plus className="w-4 h-4" /> Add Student
                 </button>
              </div>

              {/* Students Content */}
              <div className="flex flex-col lg:flex-row gap-6">
                <section className="flex-1 flex flex-col bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div className="space-y-1">
                      <h2 className="text-lg font-semibold flex items-center gap-2">
                        <span className="w-2 h-2 justify-center bg-purple-500 rounded-full"></span> Hearing-Impaired Students
                      </h2>
                      <p className="text-xs text-zinc-500">Visual & sign language support needed</p>
                    </div>
                    <span className="text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-1 rounded-md">
                      {filteredStudents.filter(s => s.isHearingImpaired).length} STUDENTS
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     {filteredStudents.filter(s => s.isHearingImpaired).map(student => (
                        <div 
                           key={student.id} 
                           onClick={() => setSelectedStudent(student)}
                           className="bg-zinc-800/50 border border-zinc-700/50 p-4 rounded-2xl flex items-center justify-between shadow-sm hover:border-zinc-500 transition-colors cursor-pointer"
                        >
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 relative">
                                <UserCircle className="w-6 h-6" />
                                {student.status === 'Online' && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-zinc-800"></span>}
                              </div>
                              <div>
                                <span className="font-medium text-sm text-zinc-200 block">{student.name}</span>
                                <span className="text-xs text-zinc-500">{student.grade}</span>
                              </div>
                           </div>
                           <EarOff className="w-5 h-5 text-purple-400" />
                        </div>
                     ))}
                     {filteredStudents.filter(s => s.isHearingImpaired).length === 0 && (
                        <p className="text-zinc-500 italic col-span-full py-2">No hearing-impaired students found.</p>
                     )}
                  </div>
                </section>

                <section className="flex-1 flex flex-col bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div className="space-y-1">
                      <h2 className="text-lg font-semibold flex items-center gap-2">
                        <span className="w-2 h-2 bg-orange-500 rounded-full"></span> Visually-Impaired Students
                      </h2>
                      <p className="text-xs text-zinc-500">Audio descriptions & screen reader support</p>
                    </div>
                    <span className="text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-1 rounded-md">
                      {filteredStudents.filter(s => s.isVisuallyImpaired).length} STUDENTS
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {filteredStudents.filter(s => s.isVisuallyImpaired).map(student => (
                        <div 
                           key={student.id} 
                           onClick={() => setSelectedStudent(student)}
                           className="bg-zinc-800/50 border border-zinc-700/50 p-4 rounded-2xl flex items-center justify-between shadow-sm hover:border-zinc-500 transition-colors cursor-pointer"
                        >
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 relative">
                                <UserCircle className="w-6 h-6" />
                                {student.status === 'Online' && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-zinc-800"></span>}
                              </div>
                              <div>
                                <span className="font-medium text-sm text-zinc-200 block">{student.name}</span>
                                <span className="text-xs text-zinc-500">{student.grade}</span>
                              </div>
                           </div>
                           <MicOff className="w-5 h-5 text-orange-400" />
                        </div>
                     ))}
                     {filteredStudents.filter(s => s.isVisuallyImpaired).length === 0 && (
                        <p className="text-zinc-500 italic col-span-full py-2">No visually-impaired students found.</p>
                     )}
                  </div>
                </section>
              </div>
            </div>
          )}
        </main>
      </div>
      


      {/* Add Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-zinc-800">
              <h3 className="text-xl font-bold text-white">Add New Student</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddStudent} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Student Name</label>
                <input 
                  type="text" 
                  autoFocus
                  required
                  value={newStudent.name}
                  onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white placeholder-zinc-500"
                  placeholder="e.g. Alex Johnson"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Grade / Class</label>
                <input 
                  type="text" 
                  value={newStudent.grade}
                  required
                  onChange={e => setNewStudent({...newStudent, grade: e.target.value})}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white placeholder-zinc-500"
                />
              </div>
              <div className="space-y-3 pt-2 border-t border-zinc-800">
                <label className="block text-sm font-medium text-zinc-400">Needs / Accommodations</label>
                <label className="flex items-center gap-3 p-3 bg-zinc-800/50 border border-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-800 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={newStudent.isHearingImpaired}
                    onChange={e => setNewStudent({...newStudent, isHearingImpaired: e.target.checked})}
                    className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-zinc-900"
                  />
                  <div className="flex items-center gap-2">
                    <EarOff className="w-4 h-4 text-purple-400" />
                    <span className="text-zinc-200 text-sm font-medium">Hearing-Impaired Student</span>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 bg-zinc-800/50 border border-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-800 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={newStudent.isVisuallyImpaired}
                    onChange={e => setNewStudent({...newStudent, isVisuallyImpaired: e.target.checked})}
                    className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-zinc-900"
                  />
                  <div className="flex items-center gap-2">
                    <EyeOff className="w-4 h-4 text-orange-400" />
                    <span className="text-zinc-200 text-sm font-medium">Visually-Impaired Student</span>
                  </div>
                </label>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-zinc-300 font-medium hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!newStudent.name.trim()}
                  className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Schedule Modal */}
      {isAddScheduleModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
            <div className="flex justify-between items-center p-6 border-b border-zinc-800">
              <h3 className="text-xl font-bold text-white">Add Schedule Period</h3>
              <button 
                onClick={() => setIsAddScheduleModalOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddPeriod} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Time Period</label>
                  <input 
                    type="text" 
                    autoFocus
                    required
                    value={newPeriod.time}
                    onChange={e => setNewPeriod({...newPeriod, time: e.target.value})}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white placeholder-zinc-500"
                    placeholder="09:00 AM - 10:30 AM"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Subject</label>
                  <input 
                    type="text" 
                    required
                    value={newPeriod.subject}
                    onChange={e => setNewPeriod({...newPeriod, subject: e.target.value})}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white placeholder-zinc-500"
                    placeholder="Mathematics"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Topic</label>
                <input 
                  type="text" 
                  value={newPeriod.topic}
                  onChange={e => setNewPeriod({...newPeriod, topic: e.target.value})}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white placeholder-zinc-500"
                  placeholder="Algebraic Expressions"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Book</label>
                  <input 
                    type="text" 
                    value={newPeriod.book}
                    onChange={e => setNewPeriod({...newPeriod, book: e.target.value})}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white placeholder-zinc-500"
                    placeholder="Ch 4, Pg 42"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Materials (comma sep)</label>
                  <input 
                    type="text" 
                    value={newPeriod.materials}
                    onChange={e => setNewPeriod({...newPeriod, materials: e.target.value})}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white placeholder-zinc-500"
                    placeholder="Flashcards, Blocks"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Homework</label>
                <textarea 
                  value={newPeriod.homework}
                  onChange={e => setNewPeriod({...newPeriod, homework: e.target.value})}
                  rows={2}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white placeholder-zinc-500 resize-none"
                  placeholder="Complete exercises 1-15 on page 44."
                ></textarea>
              </div>
              
              <div className="pt-4 flex justify-end gap-3 border-t border-zinc-800">
                <button 
                  type="button"
                  onClick={() => setIsAddScheduleModalOpen(false)}
                  className="px-4 py-2 text-zinc-300 font-medium hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!newPeriod.time.trim() || !newPeriod.subject.trim()}
                  className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Period
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selected Student Profile Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
            <button 
              onClick={() => setSelectedStudent(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-8">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 relative">
                  <UserCircle className="w-12 h-12" />
                  {selectedStudent.status === 'Online' && (
                    <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-zinc-900"></span>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedStudent.name}</h2>
                  <p className="text-zinc-400 text-lg">{selectedStudent.grade}</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-800">
                  <h4 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">Accommodations</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedStudent.isHearingImpaired && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full text-sm font-medium">
                        <EarOff className="w-4 h-4" /> Hearing-Impaired
                      </span>
                    )}
                    {selectedStudent.isVisuallyImpaired && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-full text-sm font-medium">
                        <EyeOff className="w-4 h-4" /> Visually-Impaired
                      </span>
                    )}
                    {!selectedStudent.isHearingImpaired && !selectedStudent.isVisuallyImpaired && (
                      <span className="text-zinc-400 text-sm italic">None</span>
                    )}
                  </div>
                </div>

                <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-800">
                  <h4 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">Activity Status</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-300">Last Active</span>
                    <span className="text-zinc-400 text-sm">{selectedStudent.lastActive}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-zinc-800/30 p-4 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-5 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
