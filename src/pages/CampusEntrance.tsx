import React, { useState, useEffect, useCallback } from 'react';
import CampusEntranceScene from '@/components/CampusEntranceScene';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MousePointer2, Info, ArrowLeft, ChevronRight, School, User, Phone, MapPin, Compass, ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getRoomsByWing, type Room } from '@/db/api';

interface RoomInfo {
  id: string;
  name: string;
  location?: string;
  inCharge?: string;
  contact?: string;
  directions?: string;
  imageUrl?: string;
}

const mapRoomToRoomInfo = (room: Room): RoomInfo => ({
  id: room.id,
  name: room.name,
  location: room.location,
  inCharge: room.in_charge,
  contact: room.contact,
  directions: room.directions,
  imageUrl: room.image_url,
});

const CampusEntrance: React.FC = () => {
  const [selectedWing, setSelectedWing] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<RoomInfo | null>(null);
  const [wingData, setWingData] = useState<Record<string, RoomInfo[]>>({
    'Left Wing': [],
    'Centre Wing': [],
    'Right Wing': [],
  });
  const [dataLoading, setDataLoading] = useState(true);

  const loadAllWings = useCallback(async () => {
    setDataLoading(true);
    const [left, centre, right] = await Promise.all([
      getRoomsByWing('Left Wing'),
      getRoomsByWing('Centre Wing'),
      getRoomsByWing('Right Wing'),
    ]);

    const newWingData: Record<string, RoomInfo[]> = {
      'Left Wing': left.map(mapRoomToRoomInfo),
      'Centre Wing': centre.map(mapRoomToRoomInfo),
      'Right Wing': right.map(mapRoomToRoomInfo),
    };

    setWingData(newWingData);

    // Refresh selectedRoom if it is currently visible
    setSelectedRoom((prev) => {
      if (!prev) return null;
      const all = [...newWingData['Left Wing'], ...newWingData['Centre Wing'], ...newWingData['Right Wing']];
      return all.find((r) => r.id === prev.id) ?? prev;
    });
    setDataLoading(false);
  }, []);

  useEffect(() => {
    document.title = 'CampusWay !!!';
    loadAllWings();
  }, [loadAllWings]);

  const handleWingClick = (wingName: string) => {
    if (wingData[wingName]) {
      setSelectedWing(wingName);
      setSelectedRoom(null);
    }
  };

  const handleBackToCampus = () => {
    setSelectedWing(null);
    setSelectedRoom(null);
  };

  const handleRoomClick = (room: RoomInfo) => {
    setSelectedRoom(room);
  };

  const handleBackToRoomList = () => {
    setSelectedRoom(null);
  };

  const handleChatbotClick = () => {
    window.open('https://amg-ai.zapier.app', '_blank');
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="px-6 py-4 border-b bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-lg">
              <span className="text-primary-foreground font-bold text-sm">AC</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">AMGOI Campus Gateway</h1>
          </div>
          <Badge variant="secondary" className="px-3 py-1 font-medium">3D Interactive Map</Badge>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full min-h-[700px]">
          
          {/* Info Panel - Hidden when wing is selected on small screens */}
          <div className={`lg:col-span-1 space-y-6 ${selectedWing ? 'hidden lg:block' : 'block'}`}>
            <Card className="border-border/50 shadow-sm overflow-hidden">
              <div className="h-1 bg-primary w-full" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Info className="h-5 w-5 text-primary" />
                  Campus Navigator
                </CardTitle>
                <CardDescription>
                  Digital gateway of AMGOI Campus.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Explore the 3D layout of the campus. Click on any academic wing to view the directory system.
                </p>
                
                <div className="p-3 bg-muted/50 rounded-lg space-y-2 border border-border/50">
                   <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <MousePointer2 className="h-3 w-3" />
                    How to use
                  </h4>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li className="flex gap-2">
                      <ChevronRight className="h-3 w-3 mt-0.5 text-primary" />
                      <span>Click a building to focus camera</span>
                    </li>
                    <li className="flex gap-2">
                      <ChevronRight className="h-3 w-3 mt-0.5 text-primary" />
                      <span>View room directory in the side panel</span>
                    </li>
                    <li className="flex gap-2">
                      <ChevronRight className="h-3 w-3 mt-0.5 text-primary" />
                      <span>Use "Back" to reset view</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 3D Scene Area */}
          <div className="lg:col-span-3 relative group">
            <div className="relative h-[700px] w-full rounded-3xl overflow-hidden bg-slate-100 ring-1 ring-border shadow-2xl transition-all duration-500">
              <CampusEntranceScene 
                selectedWing={selectedWing} 
                onWingClick={handleWingClick} 
              />
              
              {/* Directory Panel Overlay */}
              <AnimatePresence>
                {selectedWing && (
                  <motion.div
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 100 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="absolute right-4 top-4 bottom-4 w-72 md:w-80 z-20"
                  >
                    <div 
                      className="h-full backdrop-blur-2xl border border-white/50 rounded-3xl shadow-2xl p-6 flex flex-col pointer-events-auto transition-all duration-500 overflow-hidden"
                      style={{
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.35), rgba(34, 197, 94, 0.35))',
                      }}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={selectedRoom ? handleBackToRoomList : handleBackToCampus}
                          className="w-fit h-8 px-2 hover:bg-white/20 text-slate-800"
                        >
                          <ArrowLeft className="h-4 w-4 mr-1" />
                          {selectedRoom ? 'Back to Room List' : 'Back to Campus'}
                        </Button>
                      </div>

                      <AnimatePresence mode="wait">
                        {!selectedRoom ? (
                          <motion.div
                            key="room-list"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex-1 flex flex-col overflow-hidden"
                          >
                            <div className="mb-8">
                              <div className="flex items-center gap-2 mb-1">
                                <School className="h-5 w-5 text-primary" />
                                <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                                  {selectedWing}
                                </h2>
                              </div>
                              <p className="text-xs font-medium text-slate-600 uppercase tracking-widest">
                                Academic Directory
                              </p>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-black/10 pb-1">
                                Room List
                              </h3>
                              {dataLoading ? (
                                <div className="flex flex-col gap-3">
                                  {[1,2,3].map(i => (
                                    <div key={i} className="h-14 rounded-2xl bg-white/40 animate-pulse" />
                                  ))}
                                </div>
                              ) : wingData[selectedWing as string]?.length === 0 ? (
                                <p className="text-sm text-slate-500 text-center py-4">No rooms found.</p>
                              ) : (
                                wingData[selectedWing as string]?.map((room) => (
                                  <motion.div
                                    key={room.id}
                                    onClick={() => handleRoomClick(room)}
                                    whileHover={{ y: -4, scale: 1.02 }}
                                    className="flex items-center justify-between p-4 rounded-2xl bg-white/60 hover:bg-white/80 border border-white/60 transition-all cursor-pointer group/room shadow-md hover:shadow-xl backdrop-blur-md"
                                  >
                                    <div className="flex flex-col">
                                      <span className="text-sm font-semibold text-slate-800">{room.name}</span>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover/room:text-primary transition-colors" />
                                  </motion.div>
                                ))
                              )}
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="room-info"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex-1 min-h-0 flex flex-col overflow-y-auto pr-2 space-y-6 custom-scrollbar"
                          >
                            {/* Room image */}
                            <div className="w-full rounded-2xl overflow-hidden border border-white/40 shadow-lg shrink-0">
                              {selectedRoom.imageUrl ? (
                                <img
                                  src={selectedRoom.imageUrl}
                                  alt={selectedRoom.name}
                                  className="w-full h-[180px] md:h-[240px] object-cover block"
                                />
                              ) : (
                                <div className="w-full h-[180px] md:h-[240px] bg-white/30 flex flex-col items-center justify-center gap-2">
                                  <div className="bg-white/40 rounded-full p-3">
                                    <ImageIcon className="h-7 w-7 text-emerald-600/60" />
                                  </div>
                                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">No Image Available</p>
                                </div>
                              )}
                            </div>

                            <div>
                              <h2 className="text-2xl font-bold text-slate-900 leading-tight mb-1">
                                {selectedRoom.name}
                              </h2>
                              <Badge className="bg-primary/20 text-primary border-primary/20 hover:bg-primary/20">
                                {selectedWing}
                              </Badge>
                            </div>

                            <div className="space-y-4">
                              {!selectedRoom.location && !selectedRoom.inCharge && !selectedRoom.contact && !selectedRoom.directions && (
                                <div className="p-8 rounded-2xl bg-white/30 border border-white/30 text-center space-y-4">
                                  <div className="bg-white/40 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                                    <Info className="h-6 w-6 text-emerald-700" />
                                  </div>
                                  <div className="space-y-2">
                                    <h3 className="text-slate-900 font-bold uppercase tracking-wider text-xs">Information Pending</h3>
                                    <p className="text-slate-700 text-sm leading-relaxed italic">
                                      Detailed information for this facility is currently being updated in our system. Please check back later for full directory details.
                                    </p>
                                  </div>
                                </div>
                              )}

                              {selectedRoom.location && (
                                <div className="p-4 rounded-2xl bg-white/40 border border-white/40 space-y-1">
                                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <MapPin className="h-3 w-3 text-emerald-600" />
                                    Location
                                  </div>
                                  <p className="text-slate-800 font-semibold">{selectedRoom.location}</p>
                                </div>
                              )}

                              {selectedRoom.inCharge && (
                                <div className="p-4 rounded-2xl bg-white/40 border border-white/40 space-y-1">
                                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <User className="h-3 w-3 text-emerald-600" />
                                    In-charge
                                  </div>
                                  <p className="text-slate-800 font-semibold">{selectedRoom.inCharge}</p>
                                </div>
                              )}

                              {selectedRoom.contact && (
                                <div className="p-4 rounded-2xl bg-white/40 border border-white/40 space-y-1">
                                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <Phone className="h-3 w-3 text-emerald-600" />
                                    Contact
                                  </div>
                                  <p className="text-slate-800 font-semibold">{selectedRoom.contact}</p>
                                </div>
                              )}

                              {selectedRoom.directions && (
                                <div className="p-4 rounded-2xl bg-white/40 border border-white/40 space-y-2">
                                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <Compass className="h-3 w-3 text-emerald-600" />
                                    Directions
                                  </div>
                                  <p className="text-sm text-slate-700 leading-relaxed italic bg-emerald-50/30 p-3 rounded-xl border border-emerald-100/20">
                                    {selectedRoom.directions}
                                  </p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="mt-6 pt-6 border-t border-black/5 shrink-0">
                        <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                          <Badge variant="outline" className="text-[9px] h-4 bg-white/20 border-white/40">Level 1</Badge>
                          <span>Institutional Wing</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Status Badges */}
              <div className="absolute top-6 left-6 flex gap-2 pointer-events-none z-10">
                <Badge className="bg-black/60 backdrop-blur-md text-white border-none px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                  {selectedWing ? 'Wing View' : 'Overview'}
                </Badge>
                {!selectedWing && (
                   <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-1.5 bg-primary/90 backdrop-blur-md text-primary-foreground px-2 py-1 rounded-md text-[9px] font-bold uppercase"
                   >
                     <MousePointer2 className="h-3 w-3" />
                     Interactive
                   </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 border-t bg-card text-center">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">© 2026 AMGOI Campus Navigation. High Fidelity Institutional Rendering.</p>
          <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            <span className="hover:text-primary cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-primary cursor-pointer transition-colors">Documentation</span>
            <span className="hover:text-primary cursor-pointer transition-colors">Support</span>
          </div>
        </div>
      </footer>

      {/* Floating AI Chatbot Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-[1000] pointer-events-auto group"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
      >
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
            Ask the Campus AI Assistant
            <div className="absolute top-full right-4 -mt-1">
              <div className="border-4 border-transparent border-t-slate-900"></div>
            </div>
          </div>
        </div>

        {/* Button */}
        <motion.button
          onClick={handleChatbotClick}
          className="relative px-6 py-4 rounded-2xl font-bold text-base text-white shadow-2xl backdrop-blur-xl border-2 border-white/40 transition-all duration-300 hover:shadow-emerald-500/60 min-w-[160px] sm:min-w-[200px]"
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(34, 197, 94, 0.95))',
          }}
          whileHover={{ y: -4, scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Pulsing indicator */}
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
          </span>

          <span className="flex items-center justify-center gap-2.5">
            <span className="text-2xl">💬</span>
            <span className="flex flex-col items-start">
              <span className="leading-tight">Need Help?</span>
              <span className="text-[10px] font-normal text-white/90 leading-tight hidden sm:block">Campus AI Assistant</span>
            </span>
          </span>
        </motion.button>
      </motion.div>
    </div>
  );
};

export default CampusEntrance;
