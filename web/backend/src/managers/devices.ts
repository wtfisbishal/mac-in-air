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
    ownerEmail: string; // authenticated Google email
    display: {
      width: number;
      height: number;
      scaleFactor: number;
    };
    masterSalt?: string;
    pairingChallenge?: string;
  }): Device {
    const existing = this.devices.get(deviceId);

    const device: Device = {
      id: deviceId,
      name: data.name,
      platform: data.platform,
      arch: data.arch,
      isOnline: true,
      user: data.user,
      ownerEmail: data.ownerEmail,
      display: {
        width: data.display.width,
        height: data.display.height,
        scaleFactor: data.display.scaleFactor,
      },
      masterSalt: data.masterSalt,
      pairingChallenge: data.pairingChallenge,
      socketId: data.socketId,
      connectedAt: existing?.connectedAt ?? Date.now(),
      pairedRooms: existing?.pairedRooms ?? new Set(),
    };

    this.devices.set(deviceId, device);
    console.log(`[DeviceManager] Device registered: ${deviceId} (owner: ${data.ownerEmail})`);
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
    return Array.from(this.devices.values());
  }

  // Safe serializable list for API responses — filtered by owner email.
  listForEmail(email: string): Omit<Device, 'pairedRooms' | 'socketId'>[] {
    return Array.from(this.devices.values())
      .filter((d) => d.ownerEmail === email)
      .map(({ id, name, user, ownerEmail, masterSalt, pairingChallenge, platform, arch, isOnline, connectedAt, display }) => ({
        id,
        name,
        platform,
        arch,
        user,
        ownerEmail,
        masterSalt,
        pairingChallenge,
        isOnline,
        connectedAt,
        display,
      }));
  }

  // Get a single device only if it belongs to the given email.
  getDeviceForEmail(deviceId: string, email: string): Device | undefined {
    const device = this.devices.get(deviceId);
    if (!device) return undefined;
    if (device.ownerEmail !== email) return undefined;
    return device;
  }

  // Legacy — returns all (used internally only).
  listForApi(): Omit<Device, 'pairedRooms' | 'socketId'>[] {
    return Array.from(this.devices.values()).map(({ id, name, user, ownerEmail, masterSalt, pairingChallenge, platform, arch, isOnline, connectedAt, display }) => ({
      id,
      name,
      platform,
      arch,
      user,
      ownerEmail,
      masterSalt,
      pairingChallenge,
      isOnline,
      connectedAt,
      display,
    }));
  }

  // Add a paired frontend to a device.
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
