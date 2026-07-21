import { supabase } from './supabase';

export interface Room {
  id: string;
  wing: 'Left Wing' | 'Centre Wing' | 'Right Wing';
  name: string;
  location?: string;
  in_charge?: string;
  contact?: string;
  directions?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export type RoomInput = Omit<Room, 'id' | 'created_at' | 'updated_at'>;

// Fetch rooms for a single wing
export async function getRoomsByWing(wing: string): Promise<Room[]> {
  const { data, error } = await supabase
    .from('rooms')
    .select('id, wing, name, location, in_charge, contact, directions, image_url, created_at, updated_at')
    .eq('wing', wing)
    .order('name', { ascending: true })
    .limit(200);

  if (error) {
    console.error('[api] getRoomsByWing error:', error.message);
    return [];
  }
  return Array.isArray(data) ? data : [];
}

// Fetch all rooms (used for seeding/migration checks)
export async function getAllRooms(): Promise<Room[]> {
  const { data, error } = await supabase
    .from('rooms')
    .select('id, wing, name, location, in_charge, contact, directions, image_url, created_at, updated_at')
    .order('wing', { ascending: true })
    .order('name', { ascending: true })
    .limit(500);

  if (error) {
    console.error('[api] getAllRooms error:', error.message);
    return [];
  }
  return Array.isArray(data) ? data : [];
}

// Create a new room — returns the inserted row
export async function createRoom(room: RoomInput): Promise<Room | null> {
  const payload: Record<string, string | undefined> = {
    wing: room.wing,
    name: room.name,
    location: room.location || undefined,
    in_charge: room.in_charge || undefined,
    contact: room.contact || undefined,
    directions: room.directions || undefined,
    image_url: room.image_url || undefined,
  };

  const { data, error } = await supabase
    .from('rooms')
    .insert([payload])
    .select('id, wing, name, location, in_charge, contact, directions, image_url, created_at, updated_at')
    .maybeSingle();

  if (error) {
    console.error('[api] createRoom error:', error.message);
    return null;
  }
  return data;
}

// Update a room
export async function updateRoom(
  id: string,
  updates: Partial<RoomInput>,
): Promise<Room | null> {
  const payload: Record<string, string | null | undefined> = {
    updated_at: new Date().toISOString(),
  };
  if (updates.name !== undefined)        payload.name        = updates.name || undefined;
  if (updates.wing !== undefined)        payload.wing        = updates.wing;
  if (updates.location !== undefined)    payload.location    = updates.location || null;
  if (updates.in_charge !== undefined)   payload.in_charge   = updates.in_charge || null;
  if (updates.contact !== undefined)     payload.contact     = updates.contact || null;
  if (updates.directions !== undefined)  payload.directions  = updates.directions || null;
  if (updates.image_url !== undefined)   payload.image_url   = updates.image_url || null;

  const { data, error } = await supabase
    .from('rooms')
    .update(payload)
    .eq('id', id)
    .select('id, wing, name, location, in_charge, contact, directions, image_url, created_at, updated_at')
    .maybeSingle();

  if (error) {
    console.error('[api] updateRoom error:', error.message);
    return null;
  }
  return data;
}

// Delete a room
export async function deleteRoom(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('rooms')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[api] deleteRoom error:', error.message);
    return false;
  }
  return true;
}
