import { useState, useEffect } from 'react';
import AgoraRTC, { 
  AgoraRTCProvider, 
  useJoin, 
  useLocalMicrophoneTrack, 
  usePublish, 
  useRemoteUsers, 
  useRemoteAudioTracks 
} from "agora-rtc-react";
import { Mic, MicOff, PhoneOff, User } from 'lucide-react';
import { supabase } from '../config/supabase';

// Initialize Agora Client
const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
const APP_ID = "c3c49e185ce04ba6bad85a52dc137e77"; // Your App ID

function CallRoom({ channelName, onHangup }) {
  const [micOn, setMicOn] = useState(true);
  
  // 1. Join the Agora Channel using the emergency ID as the channel name
  useJoin({ appid: APP_ID, channel: channelName, token: null });

  // 2. Get and publish local microphone
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);
  usePublish([localMicrophoneTrack]);

  // 3. Listen for the remote user (the mobile app user)
  const remoteUsers = useRemoteUsers();
  const { audioTracks } = useRemoteAudioTracks(remoteUsers);

  // 4. Auto-play audio when user joins/speaks
  useEffect(() => {
    audioTracks.forEach((track) => track.play());
  }, [audioTracks]);

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8">
      {/* Avatar Animation */}
      <div className="relative">
        <div className={`w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center border-4 ${remoteUsers.length > 0 ? 'border-green-400 animate-pulse' : 'border-blue-100'}`}>
           <User className="w-16 h-16 text-gray-400" />
        </div>
        <div className={`absolute bottom-1 right-1 w-6 h-6 border-2 border-white rounded-full ${remoteUsers.length > 0 ? 'bg-green-500' : 'bg-yellow-400'}`}></div>
      </div>

      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-800">
           {remoteUsers.length > 0 ? "Connected to User" : "Calling User..."}
        </h3>
        <p className="text-sm text-gray-500 font-mono mt-1">Channel: {channelName.slice(0, 8)}...</p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6">
        <button 
          onClick={() => setMicOn(!micOn)} 
          className={`p-4 rounded-full transition-all ${micOn ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-red-100 text-red-600'}`}
        >
           {micOn ? <Mic size={24}/> : <MicOff size={24}/>}
        </button>
        
        <button 
          onClick={onHangup} 
          className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700 shadow-lg hover:scale-110 transition-transform"
        >
           <PhoneOff size={32} />
        </button>
      </div>
    </div>
  );
}

export default function CallModal({ isOpen, onClose, emergencyId }) {
  if (!isOpen || !emergencyId) return null;

  const handleHangup = async () => {
    // Update DB to notify mobile app the call ended
    await supabase.from('emergencies').update({ call_status: 'ended' }).eq('id', emergencyId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm h-[500px] rounded-3xl shadow-2xl overflow-hidden relative p-6">
         <AgoraRTCProvider client={client}>
            <CallRoom channelName={emergencyId} onHangup={handleHangup} />
         </AgoraRTCProvider>
      </div>
    </div>
  );
}
