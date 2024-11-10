import * as vscode from 'vscode';
import { RecordingService } from './services/recordingService';
import { registerCommands } from './commands';

let recordingService: RecordingService;

export function activate(context: vscode.ExtensionContext) {
    console.log('Audio Recording Extension is now active!');
    
    recordingService = new RecordingService();
    registerCommands(context, recordingService);
}

export function deactivate() {
    if (recordingService) {
        recordingService.cleanup();
    }
}