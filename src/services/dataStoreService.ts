import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { AudioMetadata, AudioDataStore } from '../types';

export class DataStoreService {
    private dataFilePath: string;
    private data: AudioDataStore;

    constructor(workspacePath: string) {
        const audiblePath = path.join(workspacePath, '.audible');
        this.dataFilePath = path.join(audiblePath, 'data.json');
        this.data = this.loadData();
    }

    private loadData(): AudioDataStore {
        try {
            if (fs.existsSync(this.dataFilePath)) {
                const rawData = fs.readFileSync(this.dataFilePath, 'utf8');
                return JSON.parse(rawData);
            }
        } catch (error) {
            console.error('Error loading data file:', error);
        }

        // Return default structure if file doesn't exist or is invalid
        return {
            comments: [],
            version: '1.0.0'
        };
    }

    private saveData(): void {
        try {
            fs.writeFileSync(this.dataFilePath, JSON.stringify(this.data, null, 2));
        } catch (error) {
            console.error('Error saving data file:', error);
            vscode.window.showErrorMessage('Failed to save recording metadata');
        }
    }

    addRecording(metadata: AudioMetadata): void {
        this.data.comments.push(metadata);
        this.saveData();
    }

    removeRecording(id: string): void {
        this.data.comments = this.data.comments.filter(comment => comment.id !== id);
        this.saveData();
    }

    getRecordingsForFile(filePath: string): AudioMetadata[] {
        return this.data.comments.filter(comment => comment.filePath === filePath);
    }

    getRecordingAtPosition(filePath: string, line: number, character: number): AudioMetadata | undefined {
        return this.data.comments.find(comment => 
            comment.filePath === filePath &&
            comment.position.line === line &&
            comment.position.character === character
        );
    }

    updateRecordingDuration(id: string, duration: number): void {
        const comment = this.data.comments.find(r => r.id === id);
        if (comment) {
            comment.duration = duration;
            this.saveData();
        }
    }
}