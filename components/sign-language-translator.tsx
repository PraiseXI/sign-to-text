
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Camera, Type, Volume2, Mic, RefreshCw } from 'lucide-react'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const recognizeSignLanguage = async (imageData: string): Promise<string> => {
  try {
    const response = await fetch('/api/recognize-sign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: imageData }),
    })
    if (!response.ok) {
      throw new Error('Failed to recognize sign language')
    }
    const data = await response.json()
    return data.translation
  } catch (error) {
    console.error("Error recognizing sign language:", error)
    return "Error recognizing sign"
  }
}

export default function SignLanguageTranslatorComponent() {
  const [translation, setTranslation] = useState<string>('')
  const [isCapturing, setIsCapturing] = useState<boolean>(false)
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false)
  const [isListening, setIsListening] = useState<boolean>(false)
  const [isTranslating, setIsTranslating] = useState<boolean>(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (isCapturing) {
      startCamera()
    } else {
      stopCamera()
    }
  }, [isCapturing])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      console.error("Error accessing the camera", err)
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach(track => track.stop())
    }
  }

  const captureImage = async () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d')
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height)
        const imageData = canvasRef.current.toDataURL('image/jpeg')
        await translateSignLanguage(imageData)
      }
    }
  }

  const translateSignLanguage = async (imageData: string) => {
    setIsTranslating(true)
    try {
      const result = await recognizeSignLanguage(imageData)
      setTranslation(prev => prev + (prev ? ' ' : '') + result)
    } catch (error) {
      console.error("Error translating sign language", error)
    } finally {
      setIsTranslating(false)
    }
  }

  const toggleCapture = () => {
    setIsCapturing(!isCapturing)
  }

  const speakTranslation = () => {
    if ('speechSynthesis' in window) {
      setIsSpeaking(true)
      const utterance = new SpeechSynthesisUtterance(translation)
      utterance.onend = () => setIsSpeaking(false)
      speechSynthesis.speak(utterance)
    } else {
      console.error("Speech synthesis not supported")
    }
  }

  const startSpeechToText = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false

      recognition.onstart = () => {
        setIsListening(true)
      }

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setTranslation(prev => prev + (prev ? ' ' : '') + transcript)
      }

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error)
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.start()
    } else {
      console.error("Speech recognition not supported")
    }
  }

  return (
    <div className="min-h-screen bg-[#024731] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white/10 backdrop-blur-lg border-white/20">
        <CardHeader className="text-white">
          <CardTitle className="text-3xl font-bold">Sign Language Translator</CardTitle>
          <CardDescription className="text-white/70">Translate sign language to text and vice versa</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="relative aspect-video bg-black/30 rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isCapturing ? 'block' : 'hidden'}`}
            />
            {!isCapturing && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Camera className="w-16 h-16 text-white/50" />
              </div>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" width="640" height="480" />
          <div className="flex space-x-4">
            <Button 
              onClick={toggleCapture} 
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              variant="secondary"
            >
              {isCapturing ? 'Stop Camera' : 'Start Camera'}
            </Button>
            <Button 
              onClick={captureImage} 
              disabled={!isCapturing || isTranslating} 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              variant="secondary"
            >
              {isTranslating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Translating...
                </>
              ) : (
                'Translate Sign'
              )}
            </Button>
          </div>
          <div className="space-y-2">
            <label htmlFor="translation" className="block text-sm font-medium text-white/90">
              Translation
            </label>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Type className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" />
                <Input
                  id="translation"
                  value={translation}
                  readOnly
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder-white/30"
                  placeholder="Translated text will appear here"
                />
              </div>
              <Button
                onClick={speakTranslation}
                disabled={!translation || isSpeaking}
                size="icon"
                variant="secondary"
                className="bg-purple-600 hover:bg-purple-700 text-white"
                aria-label="Speak translation"
              >
                <Volume2 className={`h-4 w-4 ${isSpeaking ? 'text-white' : 'text-white/90'}`} />
              </Button>
              <Button
                onClick={startSpeechToText}
                disabled={isListening}
                size="icon"
                variant="secondary"
                className="bg-orange-600 hover:bg-orange-700 text-white"
                aria-label="Start speech-to-text"
              >
                <Mic className={`h-4 w-4 ${isListening ? 'text-white' : 'text-white/90'}`} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
