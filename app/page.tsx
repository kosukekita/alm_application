"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Calculator } from "lucide-react"
import { RandomForestRegression } from "ml-random-forest"
import Image from "next/image"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface MedicalData {
  sex: string
  weight: string
  height: string
  age: string
  alp: string
  creatinine: string
  ldh: string
}

const initialData: MedicalData = {
  sex: "",
  weight: "",
  height: "",
  age: "",
  alp: "",
  creatinine: "",
  ldh: "",
}

const fields = [
  { key: "sex" as keyof MedicalData, label: "Sex", unit: "", placeholder: "Select" },
  { key: "weight" as keyof MedicalData, label: "Weight", unit: "kg", placeholder: "e.g., 70" },
  { key: "height" as keyof MedicalData, label: "Height", unit: "m", placeholder: "e.g., 1.75" },
  { key: "age" as keyof MedicalData, label: "Age", unit: "year", placeholder: "e.g., 30" },
  { key: "alp" as keyof MedicalData, label: "ALP", unit: "U/L", placeholder: "e.g., 100" },
  { key: "creatinine" as keyof MedicalData, label: "Creatinine", unit: "mg/dL", placeholder: "e.g., 1.0" },
  { key: "ldh" as keyof MedicalData, label: "LDH", unit: "U/L", placeholder: "e.g., 200" },
]

export default function MedicalMLApp() {
  const [data, setData] = useState<MedicalData>(initialData)
  const [result, setResult] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("")

  const handleInputChange = (key: keyof MedicalData, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }))
    setError("")
  }

  const validateInputs = (): boolean => {
    for (const field of fields) {
      if (field.key === "sex") continue; // Sex is validated separately
      
      const value = data[field.key]
      if (value !== "" && (isNaN(Number(value)) || Number(value) <= 0)) {
        setError(`Please enter a valid positive number for ${field.label} or leave it empty`)
        return false
      }
    }
    return true
  }

  const preprocessData = (inputArray: number[]) => {
    // Handle NaN values by replacing them with mean values from training data
    const meanValues = [0.5, 70, 1.7, 45, 150, 1.2, 250] // Approximate mean values for [Sex, Weight, Height, Age, ALP, Creatinine, LDH]

    return inputArray.map((value, index) => (isNaN(value) ? meanValues[index] : value))
  }

  const runPrediction = async () => {
    if (!validateInputs()) return;
  
    setIsLoading(true);
    setError("");
  
    try {
      // モデルの読み込み
      const modelData = require('../trained_model/top7_rf_alm_model.json');  
      // Random Forest regression modelのインポート
      const regression = RandomForestRegression.load(modelData);
  
      // 入力データを数値配列に変換し、NaNを空の値として使用
      const inputArray = [
        data.sex === "" ? Number.NaN : data.sex === "female" ? 0 : 1,
        data.weight === "" ? Number.NaN : Number(data.weight),
        data.height === "" ? Number.NaN : Number(data.height),
        data.age === "" ? Number.NaN : Number(data.age),
        data.alp === "" ? Number.NaN : Number(data.alp),
        data.creatinine === "" ? Number.NaN : Number(data.creatinine),
        data.ldh === "" ? Number.NaN : Number(data.ldh),
      ];
  
      // 入力データを前処理してNaNを処理
      const processedInput = preprocessData(inputArray);
  
      // 予測を実行
      const prediction = regression.predict([processedInput]);
      setResult(prediction[0]);
    } catch (err) {
      setError("An error occurred during prediction. Please check your input values.");
      console.error("Prediction error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearForm = () => {
    setData(initialData)
    setResult(null)
    setError("")
  }

  const hasAnyInput = Object.values(data).some((value) => value !== "")

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Image src="/icons/sarcopenia.svg" alt="Sarcopenia Icon" width={32} height={32} className="h-8 w-8" />
            <h1 className="text-3xl font-bold text-gray-900">ALM Predictor (experimental)</h1>
          </div>
          <p className="text-gray-600 mb-4">Enter medical data to predict Appendicular Lean Mass</p>
          <div className="max-w-3xl mx-auto text-sm text-gray-600 bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p>
              This application is a simplified version using Random Forest and a subset of the data. If you are interested in
              using a more accurate TabPFN model, please feel free to contact us at{" "}
              <a href="mailto:k-kita@radiol.med.osaka-u.ac.jp" className="text-blue-600 hover:text-blue-800 underline">
                k-kita@radiol.med.osaka-u.ac.jp
              </a>
              .
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Medical Data Input
              </CardTitle>
              <CardDescription>
                Enter available data. Leave fields empty if data is unavailable (will be treated as missing values)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key}>
                    {field.label} {field.unit && `(${field.unit})`}
                  </Label>
                  {field.key === "sex" ? (
                    <Select value={data[field.key]} onValueChange={(value) => handleInputChange(field.key, value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={field.key}
                      type="number"
                      step="any"
                      placeholder={field.placeholder}
                      value={data[field.key]}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                      className="w-full"
                    />
                  )}
                </div>
              ))}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={runPrediction} disabled={isLoading} className="flex-1">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Predicting...
                    </>
                  ) : (
                    "Run Prediction"
                  )}
                </Button>
                <Button variant="outline" onClick={clearForm} disabled={isLoading}>
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Display */}
          <Card>
            <CardHeader>
              <CardTitle>Predicted ALM Value (kg)</CardTitle>
            </CardHeader>
            <CardContent>
              {result !== null ? (
                <div className="text-center p-8">
                  <div className="text-4xl font-bold text-blue-600 mb-2">{result.toFixed(2)} kg</div>
                  <p className="text-gray-600 mb-4">Predicted ALM Value (kg)</p>

                  {/* SMI Calculation - only show if height is entered */}
                  {data.height !== "" && !isNaN(Number(data.height)) && Number(data.height) > 0 && (
                    <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-600 mb-2">
                        {(result / (Number(data.height) * Number(data.height))).toFixed(2)} kg/m²
                      </div>
                      <p className="text-gray-700 font-medium mb-3">Skeletal Mass Index (SMI)</p>
                      <div className="text-sm text-gray-600 text-left">
                        <p className="font-medium mb-1">Sarcopenia Criteria:</p>
                        <p>• Male: SMI {"<"} 7.0 kg/m²</p>
                        <p>• Female: SMI {"<"} 5.4 kg/m²</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center p-8 text-gray-500">
                  <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Enter medical data and run prediction</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Input Data Summary */}
        {hasAnyInput && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Input Data Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {fields.map((field) => (
                  <div key={field.key} className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">{field.label}</div>
                    <div className="font-semibold">
                      {data[field.key] === "" ? (
                        <span className="text-gray-400">Missing (NaN)</span>
                      ) : field.key === "sex" ? (
                        data[field.key]
                      ) : (
                        `${data[field.key]} ${field.unit}`
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
