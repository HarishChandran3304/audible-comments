// types/node-audiorecorder.d.ts

declare module 'node-audiorecorder' {
    interface AudioRecorderOptions {
        program: string;
        silence: number;
    }

    class AudioRecorder {
        constructor(options: AudioRecorderOptions, logger: any);
        start(): AudioRecorder;
        stop(): void;
        stream(): NodeJS.ReadableStream;
        on(event: string, listener: (...args: any[]) => void): this;
    }

    export = AudioRecorder;
}
