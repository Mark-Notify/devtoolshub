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
    const audioCtxRef = useRef<AudioContext | null>(null);
    const gainRef = useRef<GainNode | null>(null);
    const oscRef = useRef<OscillatorNode | null>(null);
    const stopFlag = useRef(false);

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
            Swal.fire("Error", "ไม่มีข้อความให้เล่น", "warning");
            return;
        }

        // ต้องสร้าง context หลังจากมี user gesture
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

        const dot = 100; // 100 ms unit
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
            <h1 className="text-3xl font-bold mb-4">Morse Code</h1>
            <p className="text-gray-400 mb-6">
                พิมพ์ข้อความหรือรหัสมอร์ส ระบบจะตรวจจับอัตโนมัติและแปลงให้ทันที
            </p>

            <textarea
                value={input}
                onChange={handleChange}
                placeholder="พิมพ์ข้อความหรือวางรหัสมอร์สที่นี่..."
                className="w-full h-40 p-4 mb-4 rounded-xl bg-gray-900 text-gray-100 border border-gray-700 focus:ring-2 focus:ring-blue-500 resize-none font-mono"
            />

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
