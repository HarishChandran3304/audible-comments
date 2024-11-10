import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
const AudioRecorder = require('node-audiorecorder');
import { v4 as uuidv4 } from 'uuid';  // Don't forget to add uuid as a dependency
import { RecorderState, RecorderConfig, AudioMetadata } from '../types';
import { getRecorderConfig } from '../config/recorder';
import { DataStoreService } from './dataStoreService';

export class RecordingService {
    private state: RecorderState = {
        recorder: undefined,
        fileStream: undefined
    };
    private dataStore: DataStoreService;
    private recordingStartTime: number = 0;

    constructor(private workspacePath: string) {
        this.dataStore = new DataStoreService(workspacePath);
    }

    private getRecordingsPath(): string {
        return path.join(this.workspacePath, '.audible', 'comments');
    }

    private async ensureRecordingDirectory(): Promise<void> {
        const recordingsPath = this.getRecordingsPath();
        await fs.promises.mkdir(recordingsPath, { recursive: true });
    }

    private getCurrentEditorInfo(): { filePath: string; position: vscode.Position } {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            throw new Error('No active text editor');
        }

        return {
            filePath: editor.document.uri.fsPath,
            position: editor.selection.active
        };
    }

    async startRecording(): Promise<void> {
        try {
            // Get current editor information
            const { filePath, position } = this.getCurrentEditorInfo();
            
            // Generate unique ID for this recording
            const recordingId = uuidv4();
            
            // Stop any existing recording
            if (this.state.recorder) {
                await this.stopRecording();
            }

            await this.ensureRecordingDirectory();
            const audioFileName = `comment_${recordingId}.wav`;
            const audioFilePath = path.join(this.getRecordingsPath(), audioFileName);
            
            // Create metadata
            const metadata: AudioMetadata = {
                id: recordingId,
                fileName: path.basename(filePath),
                filePath: filePath,
                position: {
                    line: position.line,
                    character: position.character
                },
                audioFile: audioFileName,
                timestamp: Date.now()
            };

            // Initialize recorder
            this.state.recorder = this.initializeRecorder();
            this.state.fileStream = fs.createWriteStream(audioFilePath);
            
            // Store metadata
            this.dataStore.addRecording(metadata);
            
            // Start recording
            if (!this.state.recorder) {
                throw new Error('Failed to initialize recorder');
            }
            this.recordingStartTime = Date.now();
            this.state.recorder.start().stream().pipe(this.state.fileStream);
            
            // Show recording indicator
            const decorationType = vscode.window.createTextEditorDecorationType({
                backgroundColor: new vscode.ThemeColor('editor.wordHighlightBackground'),
                after: {
                    contentText: '🎙️ recording comment...',
                    color: new vscode.ThemeColor('editor.foreground')
                }
            });

            const editor = vscode.window.activeTextEditor;
            if (editor) {
                editor.setDecorations(decorationType, [new vscode.Range(position, position)]);
            }

            vscode.window.showInformationMessage('Recording started...', 'Stop Recording')
                .then(selection => {
                    if (selection === 'Stop Recording') {
                        this.stopRecording();
                        editor?.setDecorations(decorationType, []);
                    }
                });

        } catch (error) {
            vscode.window.showErrorMessage(
                `Failed to start recording: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    private initializeRecorder(): typeof AudioRecorder {
        const recorder = new AudioRecorder(getRecorderConfig());

        recorder
            .on('error', (err: Error) => {
                vscode.window.showErrorMessage(`Recording failed: ${err.message}`);
                this.stopRecording();
            })
            .on('end', () => {
                const duration = Date.now() - this.recordingStartTime;
                const recordings = this.dataStore.getRecordingsForFile(this.getCurrentEditorInfo().filePath);
                const lastRecording = recordings[recordings.length - 1];
                if (lastRecording) {
                    this.dataStore.updateRecordingDuration(lastRecording.id, duration);
                }
                vscode.window.showInformationMessage('Recording saved successfully');
            });

        return recorder;
    }

    async stopRecording(): Promise<void> {
        try {
            if (this.state.recorder) {
                this.state.recorder.stop();
                this.state.recorder = undefined;
            }
            
            if (this.state.fileStream) {
                this.state.fileStream.end();
                this.state.fileStream = undefined;
            }

            vscode.window.showInformationMessage('Recording stopped');
        } catch (error) {
            vscode.window.showErrorMessage(
                `Failed to stop recording: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    getRecordingsAtCursor(): AudioMetadata[] {
        try {
            const { filePath, position } = this.getCurrentEditorInfo();
            return this.dataStore.getRecordingsForFile(filePath).filter(recording => 
                recording.position.line === position.line &&
                recording.position.character === position.character
            );
        } catch (error) {
            console.error('Error getting recordings at cursor:', error);
            return [];
        }
    }

    cleanup(): void {
        if (this.state.recorder) {
            this.stopRecording();
        }
    }
}