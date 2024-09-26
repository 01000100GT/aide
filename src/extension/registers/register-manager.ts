import type { CommandManager } from '@extension/commands/command-manager'
import { logger } from '@extension/logger'
import * as vscode from 'vscode'

import { BaseRegister } from './base-register'

export class RegisterManager {
  private registers: Map<string, BaseRegister> = new Map()

  constructor(
    private context: vscode.ExtensionContext,
    public commandManager: CommandManager
  ) {}

  async setupRegister(
    RegisterClass: new (
      ...args: ConstructorParameters<typeof BaseRegister>
    ) => BaseRegister
  ): Promise<void> {
    try {
      const register = new RegisterClass(
        this.context,
        this,
        this.commandManager
      )
      await register.register()
      this.registers.set(RegisterClass.name, register)
    } catch (e) {
      logger.error('Failed to setup register', e)
    }
  }

  getRegister<T extends BaseRegister>(
    RegisterClass: new (...args: any[]) => T
  ): T | undefined {
    return this.registers.get(RegisterClass.name) as T | undefined
  }

  async cleanup(): Promise<void> {
    await Promise.allSettled(
      Array.from(this.registers.values()).map(register => register.cleanup())
    )
  }
}
