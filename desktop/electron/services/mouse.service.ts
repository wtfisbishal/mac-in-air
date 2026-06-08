import * as robot from 'robotjs';

export class MouseService {
  public async moveMouse(x: number, y: number) {
    robot.moveMouse(x, y);
  }

  public async clickMouse(button: string = 'left', doubleClick: boolean = false) {
    robot.mouseClick(button, doubleClick);
  }

  public async scrollMouse(x: number, y: number) {
    robot.scrollMouse(x, y);
  }
}

export const mouseService = new MouseService();
