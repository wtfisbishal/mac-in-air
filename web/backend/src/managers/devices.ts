import { Device } from '../types';

class DeviceManager {
  private devices: Map<string, Device> = new Map();

  // Register or update a device when it connects.
  registerDevice(deviceId: string, data: {
    name: string;
    platform: string;
    arch: string;
    socketId: string;
    user: string;
    
  }): Device {
    const existing = this.devices.get(deviceId);

    const device: Device = {
      id: deviceId,
      name: data.name,
      platform: data.platform,
      arch: data.arch,
      isOnline: true,
      user:data.user,
      socketId: data.socketId,
      connectedAt: existing?.connectedAt ?? Date.now(),
      pairedRooms: existing?.pairedRooms ?? new Set(),
    };

    this.devices.set(deviceId, device);
    console.log(`[DeviceManager] Device registered: ${deviceId} (${data.user} )`);
    return device;
  }

  
  markOffline(socketId: string): Device | null {
    for (const [, device] of this.devices) {
      if (device.socketId === socketId) {
        device.isOnline = false;
        console.log(`[DeviceManager] Device offline: ${device.id}`);
        return device;
      }
    }
    return null;
  }
 
  getDevice(deviceId: string): Device | undefined {
    return this.devices.get(deviceId);
  }


   // Get device by socket ID (for disconnect handling).

  getDeviceBySocketId(socketId: string): Device | undefined {
    for (const [, device] of this.devices) {
      if (device.socketId === socketId) return device;
    }
    return undefined;
  }


  // Return all known devices.
  getAllDevices(): Device[] {
    return Array.from(this.devices.values()).map((d) => ({
      ...d,
      pairedRooms: d.pairedRooms, // keep internal but serialize below
    }));
  }


  // Safe serializable list for API responses.
  listForApi(): Omit<Device, 'pairedRooms' | 'socketId'>[] {
    return Array.from(this.devices.values()).map(({ id, name,user, platform, arch, isOnline, connectedAt }) => ({
      id,
      name,
      platform,
      arch,
      user,
      isOnline,
      connectedAt,
    }));
  }

  
  //  Add a paired frontend to a device.

  addPairedRoom(deviceId: string, frontendSocketId: string): void {
    const device = this.devices.get(deviceId);
    if (device) {
      device.pairedRooms.add(frontendSocketId);
    }
  }

  // Remove a paired frontend from a device.

  removePairedRoom(deviceId: string, frontendSocketId: string): void {
    const device = this.devices.get(deviceId);
    if (device) {
      device.pairedRooms.delete(frontendSocketId);
    }
  }
}

export const deviceManager = new DeviceManager();
