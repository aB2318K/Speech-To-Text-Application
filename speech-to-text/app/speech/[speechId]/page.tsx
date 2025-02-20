'use client';
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth, useLogout } from "@/hooks/page";
import { HiMenu } from 'react-icons/hi';

interface Speech {
  _id: string;
  title: string;
  data: string;
}

export default function Speech() {
  useAuth();
  const logout = useLogout();
  const params = useParams();
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const speechId = params.speechId as string;
  const [speechTitle, setSpeechTitle] = useState("");
  const [speechData, setSpeechData] = useState("");
  const [editableTitle, setEditableTitle] = useState("");
  const [editableData, setEditableData] = useState("");
  const [delModalOpened, setDelModalOpened] = useState(false);
  const [exportModalOpened, setExportModalOpened] = useState(false);
  const isTitleChanged = editableTitle.trim() !== speechTitle.trim();
  const isDataChanged = editableData.trim() !== speechData.trim();
  const isDataEmpty = editableData.trim().length === 0;
  const isTitleEmpty = editableTitle.trim().length === 0;

  const [loading, setLoading] = useState(true); // Loading state

  const [isMediumScreen, setIsMediumScreen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const getSpeech = async (speechId: string, userId: string) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:9000/speeches/${speechId}?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error:', error);
      return []; 
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        const storedUserId = localStorage.getItem('userID');
        if (storedUserId && token) {
          setLoading(false);
          setUserId(storedUserId);
          const fetchSpeech = async () => {
            const fetchedSpeech = await getSpeech(speechId, storedUserId);
            if (fetchedSpeech) {
              setSpeechTitle(fetchedSpeech.title || "");
              setSpeechData(fetchedSpeech.data || "");
              setEditableTitle(fetchedSpeech.title || "");
              setEditableData(fetchedSpeech.data || "");
            }
          };
          fetchSpeech();
        }else {
          router.push('/login');
        }
    }
  }, [router]);  

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsMediumScreen(true);
      } else {
        setIsMediumScreen(false);
      }
    };
  
    handleResize(); 
  
    window.addEventListener('resize', handleResize);
  
    // Cleanup the event listener on unmount
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSave = async () => {
    if (editableTitle.trim() && editableData.trim()) {
      try {
          const requestData = {
              title: editableTitle.trim(),
              data: editableData.trim(),
              userId: userId
          };
          const token = localStorage.getItem('token');
          const response = await fetch(`http://localhost:9000/speeches/${speechId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(requestData),
          });
          
          const data = await response.json();
          if (response.ok) {
              //console.log(data);
              setSpeechTitle(editableTitle);
              setSpeechData(editableData);
          } else {
              console.log(data)
          }
        } catch (error) {
          console.error('Error:', error);
        }
    }

  };

  const handleDelete = async () => {
    const token = localStorage.getItem('token');
    const requestData = {
        userId: userId, 
    };
    try {
        const response = await fetch(`http://localhost:9000/speeches/${speechId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(requestData),
        });

        if (response.ok) {
            console.log('Speech deleted successfully');
            setDelModalOpened(false); // Close the delete modal
            router.push('/dashboard'); // Redirect to dashboard 
        } else {
            const data = await response.json();
            console.error(data.message);
        }
    } catch (error) {
        console.error('Error deleting speech:', error);
    }
  };

  const handleExportTxt = () => {
    const blob = new Blob([editableData], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${editableTitle}.txt`; 
    link.click();
    URL.revokeObjectURL(url); // Clean up the URL object after use
    setExportModalOpened(false); // Close the export modal
  };

  const handleExportCsv = () => {
    const csvData = `"Title","Data"\n"${editableTitle}","${editableData}"`; // Format as CSV
    const blob = new Blob([csvData], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${editableTitle}.csv`; 
    link.click();
    URL.revokeObjectURL(url); // Clean up the URL object after use
    setExportModalOpened(false); // Close the export modal
  };

  const deleteModal = (
    <div className="delete_modal fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-5 rounded-lg shadow-xl">
        <h3 className="text-teal-1000 text-lg mb-4">Are you sure you want to delete this speech?</h3>
        <div className="flex justify-end">
          <button
            onClick={() => setDelModalOpened(false)}
            className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 mr-2"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="confirm_delete bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  const exportModal = (
    <div className="export_modal fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-5 rounded-lg shadow-xl">
        <h3 className="text-teal-1000 text-lg mb-4">Export as a file</h3>
        <div className="flex justify-between space-x-2">
          <button
            onClick={handleExportTxt}
            className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            Export as .txt
          </button>
          <button
            onClick={handleExportCsv}
            className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            Export as .csv
          </button>
          <button
            onClick={() => setExportModalOpened(false)}
            className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 mr-2"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex h-screen bg-teal-50 items-center justify-center">
        <div className="spinner"></div> 
      </div>
    ); // Show spinner while checking auth
  }

  return (
    <div className="flex h-screen bg-teal-50">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}
      {isMediumScreen && !isSidebarOpen && 
        <HiMenu className="bg-teal-200 h-8 w-8 cursor-pointer absolute top-2 left-2 z-50 rounded-full p-1"
          onClick={() => setIsSidebarOpen(true)}
        />
      }
      {/* Sidebar */}
      <div className={`side_bar w-1/3 md:w-1/6 bg-white text-black p-4 shadow-lg left-0 h-full ${isMediumScreen && 'fixed'} transition-transform duration-300 ease-in-out z-50
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:transition-none`}
      >
        <p className="text-sm font-semibold mb-4 text-teal-800 text-center">Speech to Text Application</p>
        <ul className="space-y-2">
          <li>
            <Link href={`/dashboard`}>
              <button className="w-full py-2 px-4 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 mb-2">
                Home
              </button>
            </Link>
          </li>
          <li>
            <Link href="/create">
              <button className="w-full py-2 px-4 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 mb-2">
                Create New
              </button>
            </Link>
          </li>
          {/* 
          <li>
            <Link href="/collaborate">
              <button className="w-full py-2 px-4 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 mb-2">
                Collaborate
              </button>
            </Link>
          </li>
          */}
          <li>
            <Link href="/profile">
              <button className="w-full py-2 px-4 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 mb-2">
                Profile
              </button>
            </Link>
          </li>
          <li>
            <Link href="/login">
              <button 
                onClick={logout}
                className="w-full py-2 px-4 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500">
                Log Out
              </button>
            </Link>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <h2 className="text-2xl font-semibold text-center mb-4 text-teal-700">
          {speechTitle}
        </h2>
        <input
          id="title"
          type="text"
          placeholder="Enter title"
          value={editableTitle}
          onChange={(e) => setEditableTitle(e.target.value.replace(/\s+/g, ' '))}
          className="mb-5 w-full px-4 py-3 border border-teal-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        />
        <textarea
          id="speech"
          name="speech"
          rows={isMediumScreen ? 9 : 12}
          value={editableData}
          onChange={(e) => setEditableData(e.target.value.replace(/\s+/g, ' '))}
          className="w-full p-2 border border-teal-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        />
        <div className="flex justify-evenly mt-5">
          <button
            onClick={handleSave}
            disabled={isTitleEmpty || isDataEmpty || (!isTitleChanged && !isDataChanged)}
            className={`w-1/4 h-8 md:h-auto py-1 px-2 md:py-3 md:px-4 rounded-md
              ${isTitleEmpty || isDataEmpty || (!isTitleChanged && !isDataChanged)
                ? 'bg-teal-100 text-gray-600'
                : 'bg-teal-600 hover:bg-teal-700 text-white'}
              focus:outline-none focus:ring-2 focus:ring-teal-500`}
          >
            Save
          </button>
          <button
            onClick={() => setDelModalOpened(true)}
            className="w-1/4 h-8 md:h-auto py-1 px-2 md:py-3 md:px-4 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            Delete
          </button>
          {delModalOpened && deleteModal}
          <button
            onClick={() => setExportModalOpened(true)}
            disabled={isDataEmpty}
            className={`w-1/4 h-8 md:h-auto py-1 px-2 md:py-3 md:px-4 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 ${isDataEmpty ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Export
          </button>
          {exportModalOpened && exportModal}
        </div>
      </div>
    </div>
  );
}
