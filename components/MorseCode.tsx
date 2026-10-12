"use client";
import { useState, useRef, useEffect } from "react";
import ToolPage from "./ui/ToolPage";
import { toastSuccess, toastWarning, alertInfo, alertError as swalAlertError } from "../lib/swal";

const morseMap: Record<string, string> = {
    A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.",
    G: "--.", H: "....", I: "..", J: ".---", K: "-.-", L: ".-..",
    M: "--", N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.",
    S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-",
    Y: "-.--", Z: "--..",
    0: "-----", 1: ".----", 2: "..---", 3: "...--", 4: "....-",
    5: ".....", 6: "-....", 7: "--...", 8: "---..", 9: "----."
};

const reverseMap = Object.fromEntries(
    Object.entries(morseMap).map(([k, v]) => [v, k])
);

export default function MorseCodeTool() {
    const [input, setInput] = useState("");
    const [output, setOutput] = useState("");
    const [isPlaying, setIsPlaying] = useState(false);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const gainRef = useRef<GainNode | null>(null);
    const oscRef = useRef<OscillatorNode | null>(null);
    const stopFlag = useRef(false);
    const streamRef = useRef<MediaStream | null>(null);

    /** ตรวจจับว่า input เป็นรหัสมอร์สหรือข้อความปกติ */
    const detectMode = (text: string) =>
        /^[.\-\s/]+$/.test(text.trim()) ? "decode" : "encode";

    /** ฟังก์ชันแปลง encode/decode */
    const process = (text: string) => {
        if (!text.trim()) {
            setOutput("");
            return;
        }
        const mode = detectMode(text);
        if (mode === "encode") {
            const encoded = text
                .toUpperCase()
                .split("")
                .map((ch) => morseMap[ch] || ch)
                .join(" ");
            setOutput(encoded);
        } else {
            const decoded = text
                .split(" ")
                .map((code) => reverseMap[code] || code)
                .join("");
            setOutput(decoded);
        }
    };

    /** auto decode/encode เมื่อพิมพ์หรือวาง */
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setInput(value);
        process(value);
    };

    /** ถ้ามี text ใน query ?text=HELLO ให้ auto decode */
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const textParam = params.get("text");
        if (textParam) {
            setInput(textParam);
            process(textParam);
        }
    }, []);

    /** Helper: delay */
    const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

    /** 🔊 เล่นเสียงมอร์ส */
    const playMorse = async () => {
        if (!output.trim()) {
            toastWarning("ไม่มีข้อความให้เล่น");
            return;
        }

        const audioCtx = new (window.AudioContext ||
            (window as any).webkitAudioContext)();
        const gain = audioCtx.createGain();
        const osc = audioCtx.createOscillator();
        osc.frequency.value = 600;
        osc.type = "sine";
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();

        audioCtxRef.current = audioCtx;
        gainRef.current = gain;
        oscRef.current = osc;
        stopFlag.current = false;
        setIsPlaying(true);

        const dot = 100; // 100ms per dot
        const pattern = output.split("");

        for (const symbol of pattern) {
            if (stopFlag.current) break;

            if (symbol === ".") {
                gain.gain.setTargetAtTime(1, audioCtx.currentTime, 0.01);
                await sleep(dot);
                gain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.01);
                await sleep(dot);
            } else if (symbol === "-") {
                gain.gain.setTargetAtTime(1, audioCtx.currentTime, 0.01);
                await sleep(dot * 3);
                gain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.01);
                await sleep(dot);
            } else {
                await sleep(dot * 2);
            }
        }

        osc.stop();
        audioCtx.close();
        setIsPlaying(false);
    };

    /** 🔇 หยุดเสียง */
    const stopMorse = () => {
        stopFlag.current = true;
        setIsPlaying(false);
        try {
            if (oscRef.current) oscRef.current.stop();
            if (audioCtxRef.current) audioCtxRef.current.close();
        } catch { }
    };

    /** 💡 เปิดแฟลชไฟ (Android Chrome เท่านั้น) */
    const toggleFlash = async () => {
        try {
            if (!streamRef.current) {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "environment" },
                });
                streamRef.current = stream;
            }

            const track = streamRef.current.getVideoTracks()[0];
            const cap = track.getCapabilities() as MediaTrackCapabilities & {
                torch?: boolean;
            };

            if (!cap.torch) {
                alertInfo("⚠️", "อุปกรณ์นี้ไม่รองรับแฟลช");
                return;
            }

            const setTorch = async (on: boolean) => {
                await track.applyConstraints({ advanced: [{ torch: on }] as any });
            };

            const pattern = output.split("");

            for (const symbol of pattern) {
                if (symbol === ".") {
                    await setTorch(true);
                    await sleep(150);
                    await setTorch(false);
                    await sleep(150);
                } else if (symbol === "-") {
                    await setTorch(true);
                    await sleep(400);
                    await setTorch(false);
                    await sleep(200);
                } else {
                    await sleep(300);
                }
            }
        } catch (err) {
            swalAlertError("Error", "ไม่สามารถเปิดแฟลชได้");
        }
    };

    /** 🧹 ล้างข้อมูล */
    const clearAll = () => {
        setInput("");
        setOutput("");
    };

    /** 📋 คัดลอกลิงก์ auto decode */
    const copyLink = () => {
        if (!input.trim()) return;
        const baseUrl = "https://www.devtoolshub.org/morse-code-decoder";
        const url = `${baseUrl}?text=${encodeURIComponent(input.trim())}`;
        navigator.clipboard.writeText(url);
        toastSuccess("คัดลอกลิงก์สำเร็จ");
    };

    return (
        <ToolPage
            slug="morse-code-decoder"
            description="พิมพ์ข้อความหรือรหัสมอร์ส ระบบจะตรวจจับอัตโนมัติและแปลงให้ทันที"
            width="narrow"
        >
            <div className="flex flex-col gap-1">
                <label className="tool-label">ข้อความ / รหัสมอร์ส</label>
                <textarea
                    value={input}
                    onChange={handleChange}
                    placeholder="พิมพ์ข้อความหรือวางรหัสมอร์สที่นี่..."
                    className="input-area h-36 resize-none font-mono text-sm"
                />
            </div>
            <div className="flex flex-col gap-1">
                <label className="tool-label">ผลลัพธ์</label>
                <textarea
                    value={output}
                    readOnly
                    placeholder="ผลลัพธ์จะแสดงที่นี่..."
                    className="input-area h-36 resize-none font-mono text-sm"
                />
            </div>
            <div className="flex flex-wrap justify-center gap-2">
                {!isPlaying ? (
                    <button onClick={playMorse} className="btn btn-sm btn-primary">
                        🔊 เล่นเสียง
                    </button>
                ) : (
                    <button onClick={stopMorse} className="btn btn-sm btn-error">
                        ⏹️ หยุดเสียง
                    </button>
                )}
                <button onClick={toggleFlash} className="btn btn-sm btn-soft">
                    💡 แฟลชไฟ
                </button>
                <button onClick={copyLink} className="btn btn-sm btn-soft">
                    🔗 Copy Link
                </button>
                <button onClick={clearAll} className="btn btn-sm btn-soft">
                    🧹 ล้าง
                </button>
            </div>
        </ToolPage>
    );
}
