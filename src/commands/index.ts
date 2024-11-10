import * as vscode from 'vscode';
import { RecordingService } from '../services/recordingService';

export const registerCommands = (
    context: vscode.ExtensionContext,
    recordingService: RecordingService
): void => {
    const startRecordingCommand = vscode.commands.registerCommand(
        'audible-comments.startRecording',
        () => recordingService.startRecording()
    );

    const stopRecordingCommand = vscode.commands.registerCommand(
        'audible-comments.stopRecording',
        () => recordingService.stopRecording()
    );

    context.subscriptions.push(startRecordingCommand, stopRecordingCommand);
};