"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function Calculator() {
  const [display, setDisplay] = useState("0");
  const [memory, setMemory] = useState<string | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [resetOnNextInput, setResetOnNextInput] = useState(false);
  const [shift, setShift] = useState(false);
  const [alpha, setAlpha] = useState(false);
  const [storedMemory, setStoredMemory] = useState<number>(0);
  const [isRadianMode, setIsRadianMode] = useState(false);
  const [errorState, setErrorState] = useState(false);

  // Maximum display length for LCD
  const MAX_DISPLAY_LENGTH = 16;

  // Format number for display with overflow handling
  const formatForDisplay = (value: number | string): string => {
    const numStr = typeof value === "string" ? value : value.toString();

    // Handle error state
    if (
      numStr === "Error" ||
      numStr === "Infinity" ||
      numStr === "-Infinity" ||
      numStr === "NaN"
    ) {
      setErrorState(true);
      return "Error";
    }

    // Convert to number for processing
    const num = typeof value === "string" ? Number.parseFloat(value) : value;

    // Check if it's a valid number
    if (isNaN(num)) {
      setErrorState(true);
      return "Error";
    }

    // Handle scientific notation for very large or small numbers
    if (Math.abs(num) >= 1e10 || (Math.abs(num) < 0.0000001 && num !== 0)) {
      // Format in scientific notation
      const expStr = num.toExponential(4);

      // Ensure it fits in display
      if (expStr.length > MAX_DISPLAY_LENGTH) {
        return expStr.substring(0, MAX_DISPLAY_LENGTH);
      }
      return expStr;
    }

    // For regular numbers, limit decimal places
    if (numStr.includes(".")) {
      const parts = numStr.split(".");
      const intPart = parts[0];
      let decPart = parts[1];

      // If integer part is already too long
      if (intPart.length >= MAX_DISPLAY_LENGTH) {
        return intPart.substring(0, MAX_DISPLAY_LENGTH);
      }

      // Limit decimal places to fit in display
      const maxDecimalPlaces = MAX_DISPLAY_LENGTH - intPart.length - 1; // -1 for decimal point
      if (decPart.length > maxDecimalPlaces) {
        decPart = decPart.substring(0, maxDecimalPlaces);
      }

      // Remove trailing zeros
      while (decPart.endsWith("0")) {
        decPart = decPart.slice(0, -1);
      }

      return decPart.length > 0 ? `${intPart}.${decPart}` : intPart;
    }

    // For integers
    return numStr.length > MAX_DISPLAY_LENGTH
      ? numStr.substring(0, MAX_DISPLAY_LENGTH)
      : numStr;
  };

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        handleNumberInput(e.key);
      } else if (e.key === ".") {
        handleDecimalInput();
      } else if (
        e.key === "+" ||
        e.key === "-" ||
        e.key === "*" ||
        e.key === "/"
      ) {
        handleOperationInput(e.key);
      } else if (e.key === "Enter" || e.key === "=") {
        handleCalculate();
      } else if (e.key === "Backspace") {
        handleBackspace();
      } else if (e.key === "Delete") {
        handleClear();
      } else if (e.key === "Escape") {
        handleAllClear();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [display, memory, operation, resetOnNextInput]);

  const handleNumberInput = (num: string) => {
    if (errorState) {
      setErrorState(false);
      setDisplay(num);
      return;
    }

    if (display === "0" || resetOnNextInput) {
      setDisplay(num);
      setResetOnNextInput(false);
    } else {
      // Prevent adding more digits if we're at max length
      if (display.replace(/[-.]/g, "").length >= MAX_DISPLAY_LENGTH) return;
      setDisplay(display + num);
    }
  };

  const handleDecimalInput = () => {
    if (errorState) {
      setErrorState(false);
      setDisplay("0.");
      return;
    }

    if (resetOnNextInput) {
      setDisplay("0.");
      setResetOnNextInput(false);
    } else if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  };

  const handleOperationInput = (op: string) => {
    if (errorState) {
      setErrorState(false);
      setDisplay("0");
      return;
    }

    if (memory !== null && !resetOnNextInput) {
      handleCalculate();
    }
    setMemory(display);
    setOperation(op);
    setResetOnNextInput(true);
  };

  const handleCalculate = () => {
    if (errorState) {
      setErrorState(false);
      setDisplay("0");
      return;
    }

    if (memory === null || operation === null) return;

    let result = 0;
    const num1 = Number.parseFloat(memory);
    const num2 = Number.parseFloat(display);

    try {
      switch (operation) {
        case "+":
          result = num1 + num2;
          break;
        case "-":
          result = num1 - num2;
          break;
        case "*":
        case "×":
          result = num1 * num2;
          break;
        case "/":
        case "÷":
          if (num2 === 0) throw new Error("Division by zero");
          result = num1 / num2;
          break;
        case "^":
          result = Math.pow(num1, num2);
          break;
        default:
          return;
      }

      setDisplay(formatForDisplay(result));
      setMemory(null);
      setOperation(null);
      setResetOnNextInput(true);
    } catch (error) {
      setDisplay("Error");
      setErrorState(true);
    }
  };

  const handleClear = () => {
    if (errorState) {
      setErrorState(false);
    }
    setDisplay("0");
  };

  const handleAllClear = () => {
    if (errorState) {
      setErrorState(false);
    }
    setDisplay("0");
    setMemory(null);
    setOperation(null);
    setResetOnNextInput(false);
  };

  const handleBackspace = () => {
    if (errorState) {
      setErrorState(false);
      setDisplay("0");
      return;
    }

    if (display.length === 1) {
      setDisplay("0");
    } else {
      setDisplay(display.slice(0, -1));
    }
  };

  const convertToRadians = (degrees: number) => {
    return isRadianMode ? degrees : degrees * (Math.PI / 180);
  };

  const handleScientificFunction = (func: string) => {
    if (errorState) {
      setErrorState(false);
      setDisplay("0");
      return;
    }

    const num = Number.parseFloat(display);
    let result = 0;

    try {
      switch (func) {
        case "sin":
          result = shift
            ? Math.asin(num) * (isRadianMode ? 1 : 180 / Math.PI)
            : Math.sin(convertToRadians(num));
          break;
        case "cos":
          result = shift
            ? Math.acos(num) * (isRadianMode ? 1 : 180 / Math.PI)
            : Math.cos(convertToRadians(num));
          break;
        case "tan":
          result = shift
            ? Math.atan(num) * (isRadianMode ? 1 : 180 / Math.PI)
            : Math.tan(convertToRadians(num));
          break;
        case "ln":
          if (num <= 0) throw new Error("Invalid input");
          result = Math.log(num);
          break;
        case "log":
          if (num <= 0) throw new Error("Invalid input");
          result = Math.log10(num);
          break;
        case "sqrt":
          if (num < 0) throw new Error("Invalid input");
          result = Math.sqrt(num);
          break;
        case "x2":
          result = Math.pow(num, 2);
          break;
        case "x3":
          result = Math.pow(num, 3);
          break;
        case "1/x":
          if (num === 0) throw new Error("Division by zero");
          result = 1 / num;
          break;
        case "exp":
          result = Math.exp(num);
          break;
        case "pi":
          result = Math.PI;
          break;
        case "e":
          result = Math.E;
          break;
        case "abs":
          result = Math.abs(num);
          break;
        case "fact":
          if (num < 0 || !Number.isInteger(num) || num > 170)
            throw new Error("Invalid input");
          result = factorial(num);
          break;
        case "sin2":
          result = Math.pow(Math.sin(convertToRadians(num)), 2);
          break;
        case "10x":
          result = Math.pow(10, num);
          break;
        case "toggleSign":
          result = -num;
          break;
        default:
          return;
      }

      setDisplay(formatForDisplay(result));
      setResetOnNextInput(true);
      setShift(false);
    } catch (error) {
      setDisplay("Error");
      setErrorState(true);
    }
  };

  const factorial = (n: number): number => {
    if (n === 0 || n === 1) return 1;
    return n * factorial(n - 1);
  };

  const handleShift = () => {
    setShift(!shift);
    setAlpha(false);
  };

  const handleAlpha = () => {
    setAlpha(!alpha);
    setShift(false);
  };

  const handleAns = () => {
    // In a real calculator, this would recall the last answer
    // For simplicity, we'll just use the current display value
    if (resetOnNextInput) {
      setResetOnNextInput(false);
    }
  };

  const handleMemoryFunction = (action: string) => {
    if (errorState) return;

    const currentValue = Number.parseFloat(display);

    switch (action) {
      case "M+":
        setStoredMemory(storedMemory + currentValue);
        setResetOnNextInput(true);
        break;
      case "M-":
        setStoredMemory(storedMemory - currentValue);
        setResetOnNextInput(true);
        break;
      case "MR":
        setDisplay(formatForDisplay(storedMemory));
        setResetOnNextInput(true);
        break;
      case "MC":
        setStoredMemory(0);
        break;
    }
  };

  const handleToggleRadianMode = () => {
    setIsRadianMode(!isRadianMode);
  };

  return (
    <div className="relative w-full max-w-[320px] mx-auto bg-[#333333] rounded-[30px] shadow-2xl p-4 pt-6 pb-8 border-t border-[#444444] border-b-[12px] border-b-[#222222] border-r-[6px] border-r-[#222222] border-l-[6px] border-l-[#444444]">
      {/* Brand Name */}
      <div className="absolute top-[15px] left-6 text-white text-xs font-bold">
        <div className="text-[#ddd] tracking-wider">CASIO</div>
        <div className="text-[#aaa] text-[10px] tracking-wide">fx-991EX</div>
      </div>

      {/* Solar Panel */}
      <div className="absolute top-[15px] right-6 w-[140px] h-[25px] bg-[#444] rounded-sm flex">
        <div className="w-1/6 h-full border-r border-[#333]"></div>
        <div className="w-1/6 h-full border-r border-[#333]"></div>
        <div className="w-1/6 h-full border-r border-[#333]"></div>
        <div className="w-1/6 h-full border-r border-[#333]"></div>
        <div className="w-1/6 h-full border-r border-[#333]"></div>
        <div className="w-1/6 h-full"></div>
      </div>

      {/* Display */}
      <div className="mt-12 mb-6 mx-2 bg-[#c0ceb0] rounded-md p-3 h-[70px] flex items-end justify-end shadow-inner border-2 border-[#222] overflow-hidden">
        <div
          className="text-[#222] text-4xl font-lcd"
          style={{ transform: "scaleY(1.05)" }}
        >
          {display}
          {storedMemory !== 0 && (
            <span className="text-sm absolute top-2 left-3 font-digital">
              M
            </span>
          )}
          {isRadianMode && (
            <span className="text-sm absolute top-2 right-3 font-digital">
              RAD
            </span>
          )}
        </div>
      </div>

      {/* Button Rows */}
      <div className="grid grid-cols-5 gap-2 mt-4">
        {/* Row 1 - Top function buttons */}
        <button
          className={cn(
            "text-white text-xs py-2 px-1 rounded-[8px] bg-[#444] border border-t-[#555] border-l-[#555] border-b-[#222] border-r-[#222] shadow-md active:shadow-inner active:border-t-[#222] active:border-l-[#222] active:border-b-[#555]",
            shift && "bg-[#555]"
          )}
          onClick={handleShift}
        >
          SHIFT
        </button>
        <button
          className={cn(
            "text-white text-xs py-2 px-1 rounded-[8px] bg-[#444] border border-t-[#555] border-l-[#555] border-b-[#222] border-r-[#222] shadow-md active:shadow-inner active:border-t-[#222] active:border-l-[#222] active:border-b-[#555]",
            alpha && "bg-[#555]"
          )}
          onClick={handleAlpha}
        >
          ALPHA
        </button>
        <div className="flex justify-center items-center">
          <div className="w-[40px] h-[40px] bg-[#333] rounded-full border-2 border-[#222] flex flex-col justify-center items-center">
            <div className="flex justify-center items-center">
              <div className="w-[10px] h-[10px] text-[#888] flex justify-center items-center">
                ▲
              </div>
            </div>
            <div className="flex justify-center items-center">
              <div className="w-[10px] h-[10px] text-[#888] flex justify-center items-center">
                ◀
              </div>
              <div className="w-[10px] h-[10px] text-[#888] flex justify-center items-center">
                ▶
              </div>
            </div>
            <div className="flex justify-center items-center">
              <div className="w-[10px] h-[10px] text-[#888] flex justify-center items-center">
                ▼
              </div>
            </div>
          </div>
        </div>
        <button
          className="text-white text-xs py-2 px-1 rounded-[8px] bg-[#444] border border-t-[#555] border-l-[#555] border-b-[#222] border-r-[#222] shadow-md active:shadow-inner active:border-t-[#222] active:border-l-[#222] active:border-b-[#555]"
          onClick={() => handleScientificFunction("ln")}
        >
          ln
        </button>
        <button
          className="text-white text-xs py-2 px-1 rounded-[8px] bg-[#444] border border-t-[#555] border-l-[#555] border-b-[#222] border-r-[#222] shadow-md active:shadow-inner active:border-t-[#222] active:border-l-[#222] active:border-b-[#555]"
          onClick={() => handleScientificFunction("exp")}
        >
          exp
        </button>

        {/* Row 2 */}
        <button
          className="text-white text-xs py-2 px-1 rounded-[8px] bg-[#222] border border-t-[#444] border-l-[#444] border-b-[#111] border-r-[#111] shadow-md active:shadow-inner active:border-t-[#111] active:border-l-[#111] active:border-b-[#444] active:border-r-[#444]"
          onClick={handleShift}
        >
          SHIFT
        </button>
        <button className="text-white text-xs py-2 px-1 rounded-[8px] bg-[#222] border border-t-[#444] border-l-[#444] border-b-[#111] border-r-[#111] shadow-md active:shadow-inner active:border-t-[#111] active:border-l-[#111] active:border-b-[#444] active:border-r-[#444]">
          MODE
        </button>
        <button
          className="text-white text-xs py-2 px-1 rounded-[8px] bg-[#222] border border-t-[#444] border-l-[#444] border-b-[#111] border-r-[#111] shadow-md active:shadow-inner active:border-t-[#111] active:border-l-[#111] active:border-b-[#444] active:border-r-[#444]"
          onClick={() => handleScientificFunction("ln")}
        >
          ln
        </button>
        <button
          className="text-white text-xs py-2 px-1 rounded-[8px] bg-[#222] border border-t-[#444] border-l-[#444] border-b-[#111] border-r-[#111] shadow-md active:shadow-inner active:border-t-[#111] active:border-l-[#111] active:border-b-[#444] active:border-r-[#444]"
          onClick={() => handleScientificFunction("log")}
        >
          log
        </button>
        <button
          className="text-white text-xs py-2 px-1 rounded-[8px] bg-[#222] border border-t-[#444] border-l-[#444] border-b-[#111] border-r-[#111] shadow-md active:shadow-inner active:border-t-[#111] active:border-l-[#111] active:border-b-[#444] active:border-r-[#444]"
          onClick={() => handleScientificFunction("sqrt")}
        >
          √
        </button>

        {/* Row 3 */}
        <button
          className="text-white text-xs py-2 px-1 rounded-[8px] bg-[#222] border border-t-[#444] border-l-[#444] border-b-[#111] border-r-[#111] shadow-md active:shadow-inner active:border-t-[#111] active:border-l-[#111] active:border-b-[#444] active:border-r-[#444]"
          onClick={() => handleScientificFunction("sin")}
        >
          sin
        </button>
        <button
          className="text-white text-xs py-2 px-1 rounded-[8px] bg-[#222] border border-t-[#444] border-l-[#444] border-b-[#111] border-r-[#111] shadow-md active:shadow-inner active:border-t-[#111] active:border-l-[#111] active:border-b-[#444] active:border-r-[#444]"
          onClick={() => handleScientificFunction("cos")}
        >
          cos
        </button>
        <button
          className="text-white text-xs py-2 px-1 rounded-[8px] bg-[#222] border border-t-[#444] border-l-[#444] border-b-[#111] border-r-[#111] shadow-md active:shadow-inner active:border-t-[#111] active:border-l-[#111] active:border-b-[#444] active:border-r-[#444]"
          onClick={() => handleScientificFunction("tan")}
        >
          tan
        </button>
        <button
          className="text-white text-xs py-2 px-1 rounded-[8px] bg-[#222] border border-t-[#444] border-l-[#444] border-b-[#111] border-r-[#111] shadow-md active:shadow-inner active:border-t-[#111] active:border-l-[#111] active:border-b-[#444] active:border-r-[#444]"
          onClick={() => handleScientificFunction("sqrt")}
        >
          <span className="text-[10px]">√</span>x
        </button>
        <button
          className="text-white text-xs py-2 px-1 rounded-[8px] bg-[#222] border border-t-[#444] border-l-[#444] border-b-[#111] border-r-[#111] shadow-md active:shadow-inner active:border-t-[#111] active:border-l-[#111] active:border-b-[#444] active:border-r-[#444]"
          onClick={() => handleScientificFunction("x2")}
        >
          x<sup>2</sup>
        </button>

        {/* Row 4 */}
        <button
          className="text-white text-xs py-2 px-1 rounded-[8px] bg-[#222] border border-t-[#444] border-l-[#444] border-b-[#111] border-r-[#111] shadow-md active:shadow-inner active:border-t-[#111] active:border-l-[#111] active:border-b-[#444] active:border-r-[#444]"
          onClick={() => handleScientificFunction("toggleSign")}
        >
          (−)
        </button>
        <button className="text-white text-xs py-2 px-1 rounded-[8px] bg-[#222] border border-t-[#444] border-l-[#444] border-b-[#111] border-r-[#111] shadow-md active:shadow-inner active:border-t-[#111] active:border-l-[#111] active:border-b-[#444] active:border-r-[#444]">
          ( )
        </button>
        <button
          className="text-white text-xs py-2 px-1 rounded-[8px] bg-[#222] border border-t-[#444] border-l-[#444] border-b-[#111] border-r-[#111] shadow-md active:shadow-inner active:border-t-[#111] active:border-l-[#111] active:border-b-[#444] active:border-r-[#444]"
          onClick={() => handleScientificFunction("x3")}
        >
          x<sup>3</sup>
        </button>
        <button
          className="text-white text-xs py-2 px-1 rounded-[8px] bg-[#222] border border-t-[#444] border-l-[#444] border-b-[#111] border-r-[#111] shadow-md active:shadow-inner active:border-t-[#111] active:border-l-[#111] active:border-b-[#444] active:border-r-[#444]"
          onClick={() => handleScientificFunction("sin2")}
        >
          sin<sup>2</sup>
        </button>
        <button className="text-white text-xs py-2 px-1 rounded-[8px] bg-[#222] border border-t-[#444] border-l-[#444] border-b-[#111] border-r-[#111] shadow-md active:shadow-inner active:border-t-[#111] active:border-l-[#111] active:border-b-[#444] active:border-r-[#444]">
          sep
        </button>

        {/* Row 5 */}
        <button className="text-white text-xs py-2 px-1 rounded-[8px] bg-[#222] border border-t-[#444] border-l-[#444] border-b-[#111] border-r-[#111] shadow-md active:shadow-inner active:border-t-[#111] active:border-l-[#111] active:border-b-[#444] active:border-r-[#444]">
          OEO
        </button>
        <button className="text-white text-xs py-2 px-1 rounded-[8px] bg-[#222] border border-t-[#444] border-l-[#444] border-b-[#111] border-r-[#111] shadow-md active:shadow-inner active:border-t-[#111] active:border-l-[#111] active:border-b-[#444] active:border-r-[#444]">
          ,
        </button>
        <button
          className="text-white text-xs py-2 px-1 rounded-[8px] bg-[#222] border border-t-[#444] border-l-[#444] border-b-[#111] border-r-[#111] shadow-md active:shadow-inner active:border-t-[#111] active:border-l-[#111] active:border-b-[#444] active:border-r-[#444]"
          onClick={() => handleScientificFunction("x2")}
        >
          χ<sup>2</sup>
        </button>
        <button
          className="text-white text-xs py-2 px-1 rounded-[8px] bg-[#222] border border-t-[#444] border-l-[#444] border-b-[#111] border-r-[#111] shadow-md active:shadow-inner active:border-t-[#111] active:border-l-[#111] active:border-b-[#444] active:border-r-[#444]"
          onClick={() => handleOperationInput("^")}
        >
          y<sup>x</sup>
        </button>
        <button
          className="text-white text-xs py-2 px-1 rounded-[8px] bg-[#222] border border-t-[#444] border-l-[#444] border-b-[#111] border-r-[#111] shadow-md active:shadow-inner active:border-t-[#111] active:border-l-[#111] active:border-b-[#444] active:border-r-[#444]"
          onClick={handleToggleRadianMode}
        >
          {isRadianMode ? "DEG" : "RAD"}
        </button>

        {/* Row 6 - Number row 7-8-9 */}
        <button
          className="text-black text-xl py-2 px-1 rounded-[8px] bg-[#aaa] border border-t-[#ccc] border-l-[#ccc] border-b-[#888] border-r-[#888] shadow-md active:shadow-inner active:border-t-[#888] active:border-l-[#888] active:border-b-[#ccc] active:border-r-[#ccc]"
          onClick={() => handleNumberInput("7")}
        >
          7
        </button>
        <button
          className="text-black text-xl py-2 px-1 rounded-[8px] bg-[#aaa] border border-t-[#ccc] border-l-[#ccc] border-b-[#888] border-r-[#888] shadow-md active:shadow-inner active:border-t-[#888] active:border-l-[#888] active:border-b-[#ccc] active:border-r-[#ccc]"
          onClick={() => handleNumberInput("8")}
        >
          8
        </button>
        <button
          className="text-black text-xl py-2 px-1 rounded-[8px] bg-[#aaa] border border-t-[#ccc] border-l-[#ccc] border-b-[#888] border-r-[#888] shadow-md active:shadow-inner active:border-t-[#888] active:border-l-[#888] active:border-b-[#ccc] active:border-r-[#ccc]"
          onClick={() => handleNumberInput("9")}
        >
          9
        </button>
        <button
          className="text-white text-sm py-2 px-1 rounded-[8px] bg-[#444] border border-t-[#555] border-l-[#555] border-b-[#222] border-r-[#222] shadow-md active:shadow-inner active:border-t-[#222] active:border-l-[#222] active:border-b-[#555] active:border-r-[#555]"
          onClick={handleBackspace}
        >
          DEL<span className="text-yellow-400 text-xs block">⌫</span>
        </button>
        <button
          className="text-white text-sm py-2 px-1 rounded-[8px] bg-[#444] border border-t-[#555] border-l-[#555] border-b-[#222] border-r-[#222] shadow-md active:shadow-inner active:border-t-[#222] active:border-l-[#222] active:border-b-[#555] active:border-r-[#555]"
          onClick={handleAllClear}
        >
          AC<span className="text-yellow-400 text-xs block">OFF</span>
        </button>

        {/* Row 7 - Number row 4-5-6 */}
        <button
          className="text-black text-xl py-2 px-1 rounded-[8px] bg-[#aaa] border border-t-[#ccc] border-l-[#ccc] border-b-[#888] border-r-[#888] shadow-md active:shadow-inner active:border-t-[#888] active:border-l-[#888] active:border-b-[#ccc] active:border-r-[#ccc]"
          onClick={() => handleNumberInput("4")}
        >
          4
        </button>
        <button
          className="text-black text-xl py-2 px-1 rounded-[8px] bg-[#aaa] border border-t-[#ccc] border-l-[#ccc] border-b-[#888] border-r-[#888] shadow-md active:shadow-inner active:border-t-[#888] active:border-l-[#888] active:border-b-[#ccc] active:border-r-[#ccc]"
          onClick={() => handleNumberInput("5")}
        >
          5
        </button>
        <button
          className="text-black text-xl py-2 px-1 rounded-[8px] bg-[#aaa] border border-t-[#ccc] border-l-[#ccc] border-b-[#888] border-r-[#888] shadow-md active:shadow-inner active:border-t-[#888] active:border-l-[#888] active:border-b-[#ccc] active:border-r-[#ccc]"
          onClick={() => handleNumberInput("6")}
        >
          6
        </button>
        <button
          className="text-white text-xl py-2 px-1 rounded-[8px] bg-[#444] border border-t-[#555] border-l-[#555] border-b-[#222] border-r-[#222] shadow-md active:shadow-inner active:border-t-[#222] active:border-l-[#222] active:border-b-[#555] active:border-r-[#555]"
          onClick={() => handleOperationInput("×")}
        >
          ×
        </button>
        <button
          className="text-white text-xl py-2 px-1 rounded-[8px] bg-[#444] border border-t-[#555] border-l-[#555] border-b-[#222] border-r-[#222] shadow-md active:shadow-inner active:border-t-[#222] active:border-l-[#222] active:border-b-[#555] active:border-r-[#555]"
          onClick={() => handleOperationInput("÷")}
        >
          ÷
        </button>

        {/* Row 8 - Number row 1-2-3 */}
        <button
          className="text-black text-xl py-2 px-1 rounded-[8px] bg-[#aaa] border border-t-[#ccc] border-l-[#ccc] border-b-[#888] border-r-[#888] shadow-md active:shadow-inner active:border-t-[#888] active:border-l-[#888] active:border-b-[#ccc] active:border-r-[#ccc]"
          onClick={() => handleNumberInput("1")}
        >
          1
        </button>
        <button
          className="text-black text-xl py-2 px-1 rounded-[8px] bg-[#aaa] border border-t-[#ccc] border-l-[#ccc] border-b-[#888] border-r-[#888] shadow-md active:shadow-inner active:border-t-[#888] active:border-l-[#888] active:border-b-[#ccc] active:border-r-[#ccc]"
          onClick={() => handleNumberInput("2")}
        >
          2
        </button>
        <button
          className="text-black text-xl py-2 px-1 rounded-[8px] bg-[#aaa] border border-t-[#ccc] border-l-[#ccc] border-b-[#888] border-r-[#888] shadow-md active:shadow-inner active:border-t-[#888] active:border-l-[#888] active:border-b-[#ccc] active:border-r-[#ccc]"
          onClick={() => handleNumberInput("3")}
        >
          3
        </button>
        <button
          className="text-white text-xl py-2 px-1 rounded-[8px] bg-[#444] border border-t-[#555] border-l-[#555] border-b-[#222] border-r-[#222] shadow-md active:shadow-inner active:border-t-[#222] active:border-l-[#222] active:border-b-[#555] active:border-r-[#555]"
          onClick={() => handleOperationInput("+")}
        >
          +
        </button>
        <button
          className="text-white text-xl py-2 px-1 rounded-[8px] bg-[#444] border border-t-[#555] border-l-[#555] border-b-[#222] border-r-[#222] shadow-md active:shadow-inner active:border-t-[#222] active:border-l-[#222] active:border-b-[#555] active:border-r-[#555]"
          onClick={() => handleOperationInput("-")}
        >
          −
        </button>

        {/* Row 9 - Number row 0-.-ANS */}
        <button
          className="text-black text-xl py-2 px-1 rounded-[8px] bg-[#aaa] border border-t-[#ccc] border-l-[#ccc] border-b-[#888] border-r-[#888] shadow-md active:shadow-inner active:border-t-[#888] active:border-l-[#888] active:border-b-[#ccc] active:border-r-[#ccc]"
          onClick={() => handleNumberInput("0")}
        >
          0
        </button>
        <button
          className="text-black text-xl py-2 px-1 rounded-[8px] bg-[#aaa] border border-t-[#ccc] border-l-[#ccc] border-b-[#888] border-r-[#888] shadow-md active:shadow-inner active:border-t-[#888] active:border-l-[#888] active:border-b-[#ccc] active:border-r-[#ccc]"
          onClick={handleDecimalInput}
        >
          .
        </button>
        <button
          className="text-white text-sm py-2 px-1 rounded-[8px] bg-[#aaa] border border-t-[#ccc] border-l-[#ccc] border-b-[#888] border-r-[#888] shadow-md active:shadow-inner active:border-t-[#888] active:border-l-[#888] active:border-b-[#ccc] active:border-r-[#ccc]"
          onClick={handleAns}
        >
          ANS
        </button>
        <button
          className="text-white text-sm py-2 px-1 rounded-[8px] bg-[#444] border border-t-[#555] border-l-[#555] border-b-[#222] border-r-[#222] shadow-md active:shadow-inner active:border-t-[#222] active:border-l-[#222] active:border-b-[#555] active:border-r-[#555]"
          onClick={handleBackspace}
        >
          DEL<span className="text-yellow-400 text-xs block">⌫</span>
        </button>
        <button
          className="text-white text-xl py-2 px-1 rounded-[8px] bg-[#444] border border-t-[#555] border-l-[#555] border-b-[#222] border-r-[#222] shadow-md active:shadow-inner active:border-t-[#222] active:border-l-[#222] active:border-b-[#555] active:border-r-[#555]"
          onClick={handleCalculate}
        >
          =
        </button>
      </div>
    </div>
  );
}
