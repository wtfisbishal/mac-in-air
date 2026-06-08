import * as robot from 'robotjs';

export class KeyboardService {
  public async typeString(text: string) {
    robot.typeString(text);
  }

  public async keyTap(key: string, modifier?: string | string[]) {
    if (modifier) {
      robot.keyTap(key, modifier);
    } else {
      robot.keyTap(key);
    }
  }
}

export const keyboardService = new KeyboardService();
