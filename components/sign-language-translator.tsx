'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, Type, Volume2 } from 'lucide-react'

// Mock function to simulate sign language recognition
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const recognizeSignLanguage = async (imageData: string): Promise<string> => {
  const signs = ['Hello', 'Thank you', 'Please', 'Yes', 'No', 'Help']
  await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate processing time
  return signs[Math.floor(Math.random() * signs.length)]
}

export function SignLanguageTranslatorComponent() {
  const [translation, setTranslation] = useState<string>('')
  const [isCapturing, setIsCapturing] = useState<boolean>(false)
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false)
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

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d')
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height)
        const imageData = canvasRef.current.toDataURL('image/jpeg')
        translateSignLanguage(imageData)
      }
    }
  }

  const translateSignLanguage = async (imageData: string) => {
    try {
      const result = await recognizeSignLanguage(imageData)
      setTranslation(prev => prev + (prev ? ' ' : '') + result)
    } catch (error) {
      console.error("Error translating sign language", error)
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

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Sign Language Translator</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isCapturing ? 'block' : 'hidden'}`}
            />
            {!isCapturing && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Camera className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" width="640" height="480" />
          <div className="flex space-x-2">
            <Button onClick={toggleCapture} className="flex-1">
              {isCapturing ? 'Stop Camera' : 'Start Camera'}
            </Button>
            <Button onClick={captureImage} disabled={!isCapturing} className="flex-1">
              Translate Sign
            </Button>
          </div>
          <div className="space-y-2">
            <label htmlFor="translation" className="block text-sm font-medium text-gray-700">
              Translation
            </label>
            <div className="flex items-center space-x-2">
              <Type className="w-5 h-5 text-gray-400" />
              <Input
                id="translation"
                value={translation}
                readOnly
                className="flex-1"
                placeholder="Translated text will appear here"
              />
              <Button
                onClick={speakTranslation}
                disabled={!translation || isSpeaking}
                size="icon"
                aria-label="Speak translation"
              >
                <Volume2 className={`w-4 h-4 ${isSpeaking ? 'text-primary' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}