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

  public async toggleMouse(down: string, button: string = 'left') {
    robot.mouseToggle(down, button);
  }

  public async dragMouse(x: number, y: number) {
    robot.dragMouse(x, y);
  }
}

export const mouseService = new MouseService();
