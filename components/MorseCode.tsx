"use client";
import { useState, useRef, useEffect } from "react";
import Swal from "sweetalert2";

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
    const streamRef = useRef<MediaStream | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const oscRef = useRef<OscillatorNode | null>(null);

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

    /** 🔊 เล่นเสียงมอร์ส */
    const playMorse = async () => {
        if (!output.trim()) return Swal.fire("Error", "ไม่มีข้อความให้เล่น", "warning");
        setIsPlaying(true);

        const audioCtx = new (window.AudioContext ||
            (window as any).webkitAudioContext)();
        audioCtxRef.current = audioCtx;

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.value = 600;
        osc.connect(gain).connect(audioCtx.destination);
        osc.start();
        oscRef.current = osc;

        const dot = 100;
        let t = audioCtx.currentTime;

        for (const symbol of output) {
            if (!isPlaying) break; // หยุดได้กลางทาง
            if (symbol === ".") {
                gain.gain.setValueAtTime(1, t);
                t += dot / 1000;
                gain.gain.setValueAtTime(0, t);
                t += dot / 1000;
            } else if (symbol === "-") {
                gain.gain.setValueAtTime(1, t);
                t += (dot * 3) / 1000;
                gain.gain.setValueAtTime(0, t);
                t += dot / 1000;
            } else {
                t += (dot * 3) / 1000;
            }
        }

        osc.stop(t);
        setTimeout(() => setIsPlaying(false), (t - audioCtx.currentTime) * 1000);
    };

    /** 🔇 หยุดเสียง */
    const stopMorse = () => {
        setIsPlaying(false);
        if (oscRef.current) oscRef.current.stop();
        if (audioCtxRef.current) audioCtxRef.current.close();
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
                Swal.fire("⚠️", "อุปกรณ์นี้ไม่รองรับแฟลช", "info");
                return;
            }

            const pattern = output.split("");
            const setTorch = async (on: boolean) => {
                await track.applyConstraints({ advanced: [{ torch: on }] as any });
            };

            for (const symbol of pattern) {
                if (symbol === ".") {
                    await setTorch(true);
                    await new Promise((r) => setTimeout(r, 150));
                    await setTorch(false);
                    await new Promise((r) => setTimeout(r, 150));
                } else if (symbol === "-") {
                    await setTorch(true);
                    await new Promise((r) => setTimeout(r, 400));
                    await setTorch(false);
                    await new Promise((r) => setTimeout(r, 200));
                } else {
                    await new Promise((r) => setTimeout(r, 300));
                }
            }
        } catch (err) {
            Swal.fire("Error", "ไม่สามารถเปิดแฟลชได้", "error");
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
        Swal.fire("Copied!", "คัดลอกลิงก์สำเร็จ", "success");
    };

    return (
        <div className="p-6 max-w-3xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">Morse Code Encoder / Decoder</h1>
            <p className="text-gray-400 mb-6">
                พิมพ์ข้อความหรือรหัสมอร์ส ระบบจะตรวจจับอัตโนมัติและแปลงให้ทันที
            </p>

            {/* Input */}
            <textarea
                value={input}
                onChange={handleChange}
                placeholder="พิมพ์ข้อความหรือวางรหัสมอร์สที่นี่..."
                className="w-full h-40 p-4 mb-4 rounded-xl bg-gray-900 text-gray-100 border border-gray-700 focus:ring-2 focus:ring-blue-500 resize-none font-mono"
            />

            {/* Output */}
            <textarea
                value={output}
                readOnly
                placeholder="ผลลัพธ์จะแสดงที่นี่..."
                className="w-full h-40 p-4 mb-4 rounded-xl bg-gray-800 text-gray-200 border border-gray-700 font-mono"
            />

            <div className="flex flex-wrap justify-center gap-3 mt-2">
                {!isPlaying ? (
                    <button
                        onClick={playMorse}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                    >
                        🔊 เล่นเสียง
                    </button>
                ) : (
                    <button
                        onClick={stopMorse}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                    >
                        ⏹️ หยุดเสียง
                    </button>
                )}

                <button
                    onClick={toggleFlash}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition"
                >
                    💡 แฟลชไฟ
                </button>

                <button
                    onClick={copyLink}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                    🔗 Copy Link
                </button>

                <button
                    onClick={clearAll}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
                >
                    🧹 ล้าง
                </button>
            </div>
        </div>
    );
}
