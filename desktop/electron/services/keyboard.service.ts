import * as robot from 'robotjs';

export class KeyboardService {
  public async typeString(text: string) {
    robot.typeString(text);
  }

  private normalizeKey(key: string) {
  switch (key.toLowerCase()) {
    case "meta":
    case "cmd":
    case "⌘":
      return "command";

    case "control":
      return "control";

    case "option":
      return "alt";

    default:
      return key.toLowerCase();
  }
}
 
  public async keyTap(key: string, modifiers: string[] = []) {
  const normalizedKey = this.normalizeKey(key);

  console.log("KEY:", key);
  console.log("NORMALIZED:", normalizedKey);

  robot.keyTap(normalizedKey, modifiers);
}
}

export const keyboardService = new KeyboardService();
