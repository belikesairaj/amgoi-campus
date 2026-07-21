import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { getRoomsByWing, createRoom, updateRoom, deleteRoom, type Room } from '@/db/api';
import { uploadRoomImage, deleteRoomImage, type UploadProgress } from '@/lib/imageUpload';
import { isAdminAuthenticated, clearAdminAuth, verifyPassword, setAdminPassword } from '@/lib/adminAuth';
import { LogOut, Plus, Edit, Trash2, School, Save, X, Upload, ImageIcon, CheckCircle, AlertCircle, KeyRound } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [selectedWing, setSelectedWing] = useState<'Left Wing' | 'Centre Wing' | 'Right Wing'>('Left Wing');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    in_charge: '',
    contact: '',
    directions: '',
    image_url: '',
  });

  // Image upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  // imageUrlRef always holds the latest uploaded URL, avoiding stale-closure bugs in handleSaveRoom
  const imageUrlRef = useRef<string>('');
  // formDataRef mirrors formData so handleSaveRoom always reads the latest value
  const formDataRef = useRef(formData);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Change-password form state
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    // Set page title
    document.title = 'CampusWay !!! - Admin Dashboard';
    checkAuth();
  }, []);

  // Keep imageUrlRef in sync with formData so handleSaveRoom always reads the latest value
  useEffect(() => {
    imageUrlRef.current = formData.image_url;
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    loadRooms();
  }, [selectedWing]);

  const checkAuth = () => {
    if (!isAdminAuthenticated()) {
      navigate('/admin', { replace: true });
    }
  };

  const loadRooms = async () => {
    setLoading(true);
    const data = await getRoomsByWing(selectedWing);
    setRooms(data);
    setLoading(false);
  };

  const handleSignOut = () => {
    clearAdminAuth();
    navigate('/admin', { replace: true });
  };

  const handleAddRoom = () => {
    setIsAddMode(true);
    setEditingRoom(null);
    setFormData({
      name: '',
      location: '',
      in_charge: '',
      contact: '',
      directions: '',
      image_url: '',
    });
    imageUrlRef.current = '';
    setImagePreview(null);
    setUploadProgress(null);
    setUploadError(null);
    setIsDialogOpen(true);
  };

  const handleEditRoom = (room: Room) => {
    setIsAddMode(false);
    setEditingRoom(room);
    setFormData({
      name: room.name,
      location: room.location || '',
      in_charge: room.in_charge || '',
      contact: room.contact || '',
      directions: room.directions || '',
      image_url: room.image_url || '',
    });
    imageUrlRef.current = room.image_url || '';
    setImagePreview(room.image_url || null);
    setUploadProgress(null);
    setUploadError(null);
    setIsDialogOpen(true);
  };

  const handleDeleteRoom = async (id: string) => {
    if (!confirm('Are you sure you want to delete this room?')) return;
    const success = await deleteRoom(id);
    if (success) {
      await loadRooms();
    } else {
      alert('Failed to delete room. Please try again.');
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadProgress({ percent: 0, status: 'validating', message: 'Starting upload...' });

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file);
    setImagePreview(localPreview);

    try {
      const result = await uploadRoomImage(file, (progress) => {
        setUploadProgress(progress);
      });
      URL.revokeObjectURL(localPreview);
      setImagePreview(result.publicUrl);
      imageUrlRef.current = result.publicUrl;
      setFormData((prev) => ({ ...prev, image_url: result.publicUrl }));
    } catch (err) {
      URL.revokeObjectURL(localPreview);
      setImagePreview(formData.image_url || null);
      setUploadProgress(null);
      setUploadError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    }

    // Reset file input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveImage = async () => {
    if (formData.image_url) {
      // Best-effort delete — don't block UI on failure
      deleteRoomImage(formData.image_url).catch(() => {});
    }
    imageUrlRef.current = '';
    setFormData((prev) => ({ ...prev, image_url: '' }));
    setImagePreview(null);
    setUploadProgress(null);
    setUploadError(null);
  };

  const handleSaveRoom = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!formData.name.trim()) {
      alert('Room name is required');
      return;
    }

    if (uploadProgress && uploadProgress.status !== 'done' && uploadProgress.status !== 'error') {
      alert('Please wait for the image upload to complete.');
      return;
    }

    const currentImageUrl = imageUrlRef.current;
    const currentFormData = formDataRef.current;
    const resolvedImageUrl = currentImageUrl || currentFormData.image_url || formData.image_url;

    setSaving(true);

    try {
      const roomPayload = {
        wing: selectedWing,
        name: formData.name.trim(),
        location: formData.location.trim() || undefined,
        in_charge: formData.in_charge.trim() || undefined,
        contact: formData.contact.trim() || undefined,
        directions: formData.directions.trim() || undefined,
        image_url: resolvedImageUrl.trim() || undefined,
      };

      if (isAddMode) {
        const newRoom = await createRoom(roomPayload);
        if (newRoom) {
          await loadRooms();
          setIsDialogOpen(false);
          setFormData({ name: '', location: '', in_charge: '', contact: '', directions: '', image_url: '' });
          imageUrlRef.current = '';
          setImagePreview(null);
          setUploadProgress(null);
        } else {
          alert('Failed to add room. Please try again.');
        }
      } else if (editingRoom) {
        const updated = await updateRoom(editingRoom.id, {
          name: roomPayload.name,
          location: roomPayload.location,
          in_charge: roomPayload.in_charge,
          contact: roomPayload.contact,
          directions: roomPayload.directions,
          image_url: roomPayload.image_url,
        });
        if (updated) {
          await loadRooms();
          setIsDialogOpen(false);
        } else {
          alert('Failed to update room. Please try again.');
        }
      }
    } catch (error) {
      console.error('[AdminDashboard] Error saving room:', error);
      alert('An error occurred while saving the room.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (!verifyPassword(pwCurrent)) {
      setPwError('Current password is incorrect.');
      return;
    }
    if (pwNew.length < 6) {
      setPwError('New password must be at least 6 characters.');
      return;
    }
    if (pwNew !== pwConfirm) {
      setPwError('New passwords do not match.');
      return;
    }

    setPwSaving(true);
    await new Promise(resolve => setTimeout(resolve, 400));
    setAdminPassword(pwNew);
    setPwSaving(false);
    setPwSuccess('Password changed successfully.');
    setPwCurrent('');
    setPwNew('');
    setPwConfirm('');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg">
              <School className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{"AMGOI Campus Admin"}</h1>
              <p className="text-xs text-muted-foreground">Room Management Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate('/')}>
              View Campus
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Wing Selector Card */}
        <Card>
          <CardHeader>
            <CardTitle>Select Wing</CardTitle>
            <CardDescription>Choose a wing to manage its rooms</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {(['Left Wing', 'Centre Wing', 'Right Wing'] as const).map((wing) => (
                <Button
                  key={wing}
                  variant={selectedWing === wing ? 'default' : 'outline'}
                  onClick={() => setSelectedWing(wing)}
                  className="flex-1"
                >
                  {wing}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Rooms Table Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {selectedWing} Rooms
                  <Badge variant="secondary">{rooms.length}</Badge>
                </CardTitle>
                <CardDescription>Manage room information and details</CardDescription>
              </div>
              <Button onClick={handleAddRoom}>
                <Plus className="h-4 w-4 mr-2" />
                Add Room
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading rooms...</div>
            ) : rooms.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No rooms found. Click "Add Room" to create one.
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Image</TableHead>
                      <TableHead>Room Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>In-charge</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rooms.map((room) => (
                      <TableRow key={room.id}>
                        <TableCell>
                          {room.image_url ? (
                            <img
                              src={room.image_url}
                              alt={room.name}
                              className="h-10 w-14 object-cover rounded-md border"
                            />
                          ) : (
                            <div className="h-10 w-14 rounded-md border bg-muted flex items-center justify-center">
                              <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{room.name}</TableCell>
                        <TableCell>{room.location || '—'}</TableCell>
                        <TableCell>{room.in_charge || '—'}</TableCell>
                        <TableCell>{room.contact || '—'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditRoom(room)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRoom(room.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
        {/* Change Admin Password Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Change Admin Password
            </CardTitle>
            <CardDescription>Update the password required to access this dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
              <div className="space-y-2">
                <Label htmlFor="pw-current">Current Password</Label>
                <Input
                  id="pw-current"
                  type="password"
                  placeholder="••••••••"
                  value={pwCurrent}
                  onChange={(e) => { setPwCurrent(e.target.value); setPwError(''); setPwSuccess(''); }}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pw-new">New Password</Label>
                <Input
                  id="pw-new"
                  type="password"
                  placeholder="Min. 6 characters"
                  value={pwNew}
                  onChange={(e) => { setPwNew(e.target.value); setPwError(''); setPwSuccess(''); }}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pw-confirm">Confirm New Password</Label>
                <Input
                  id="pw-confirm"
                  type="password"
                  placeholder="Repeat new password"
                  value={pwConfirm}
                  onChange={(e) => { setPwConfirm(e.target.value); setPwError(''); setPwSuccess(''); }}
                  required
                />
              </div>

              {pwError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{pwError}</span>
                </div>
              )}
              {pwSuccess && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  <span>{pwSuccess}</span>
                </div>
              )}

              <Button type="submit" disabled={pwSaving}>
                <Save className="h-4 w-4 mr-2" />
                {pwSaving ? 'Saving...' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      {/* Edit/Add Room Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isAddMode ? 'Add New Room' : 'Edit Room'}</DialogTitle>
            <DialogDescription>
              {isAddMode
                ? `Add a new room to ${selectedWing}`
                : 'Update room information and details'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveRoom}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Room Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Computer Lab"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g., FL-01"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="in_charge">In-charge</Label>
                <Input
                  id="in_charge"
                  value={formData.in_charge}
                  onChange={(e) => setFormData((prev) => ({ ...prev, in_charge: e.target.value }))}
                  placeholder="e.g., John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact">Contact</Label>
                <Input
                  id="contact"
                  value={formData.contact}
                  onChange={(e) => setFormData((prev) => ({ ...prev, contact: e.target.value }))}
                  placeholder="e.g., 9876543210"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="directions">Directions</Label>
                <Textarea
                  id="directions"
                  value={formData.directions}
                  onChange={(e) => setFormData((prev) => ({ ...prev, directions: e.target.value }))}
                  placeholder="e.g., Entrance → Left Wing → 1st Floor → Turn Right"
                  rows={4}
                />
              </div>

              {/* Image Upload Section */}
              <div className="space-y-3">
                <Label>Room Image</Label>

                {/* Preview area */}
                {imagePreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-border bg-muted">
                    <img
                      src={imagePreview}
                      alt="Room preview"
                      className="w-full h-48 object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                      title="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <div className="bg-muted rounded-full p-3">
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">Click to upload room image</p>
                      <p className="text-xs text-muted-foreground mt-1">JPEG, PNG, WEBP, GIF, AVIF · Max 1 MB (auto-compressed if larger)</p>
                    </div>
                  </div>
                )}

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
                  className="hidden"
                  onChange={handleImageFileChange}
                />

                {/* Upload / Change button when preview exists */}
                {imagePreview && uploadProgress?.status !== 'uploading' && uploadProgress?.status !== 'compressing' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Change Image
                  </Button>
                )}

                {/* Progress bar */}
                {uploadProgress && uploadProgress.status !== 'done' && uploadProgress.status !== 'error' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{uploadProgress.message}</span>
                      <span>{uploadProgress.percent}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress.percent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Success notification */}
                {uploadProgress?.status === 'done' && (
                  <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    <span>{uploadProgress.message}</span>
                  </div>
                )}

                {/* Error notification */}
                {uploadError && (
                  <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                disabled={saving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit" disabled={saving || (uploadProgress !== null && uploadProgress.status !== 'done' && uploadProgress.status !== 'error')}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : (isAddMode ? 'Add Room' : 'Save Changes')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
