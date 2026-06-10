class RoomManager {

  // deviceId -> Set<frontendSocketId>  
  private rooms: Map<string, Set<string>> = new Map();

  // frontendSocketId -> deviceId 
  private socketToDevice: Map<string, string> = new Map();

   // Join a frontend socket to a device's control room.
  join(deviceId: string, frontendSocketId: string): void {
    if (!this.rooms.has(deviceId)) {
      this.rooms.set(deviceId, new Set());
    }
    this.rooms.get(deviceId)!.add(frontendSocketId);
    this.socketToDevice.set(frontendSocketId, deviceId);
    console.log(`[RoomManager] ${frontendSocketId} joined room for device ${deviceId}`);
  }

  // Remove a frontend socket from its room (on disconnect or manual leave).
  leave(frontendSocketId: string): string | null {
    const deviceId = this.socketToDevice.get(frontendSocketId);
    if (!deviceId) return null;

    this.socketToDevice.delete(frontendSocketId);
    const room = this.rooms.get(deviceId);
    if (room) {
      room.delete(frontendSocketId);
      if (room.size === 0) {
        this.rooms.delete(deviceId);
      }
    }

    console.log(`[RoomManager] ${frontendSocketId} left room for device ${deviceId}`);
    return deviceId;
  }
   // Get which device a frontend is controlling.
   
  getDeviceForSocket(frontendSocketId: string): string | null {
    return this.socketToDevice.get(frontendSocketId) ?? null;
  }
  // Get all frontend sockets in a device's room.

  getSocketsForDevice(deviceId: string): string[] {
    return Array.from(this.rooms.get(deviceId) ?? []);
  }


  //  Check if a frontend is in a room.
  isInRoom(frontendSocketId: string): boolean {
    return this.socketToDevice.has(frontendSocketId);
  }
}

export const roomManager = new RoomManager();
