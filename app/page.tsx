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

interface MedicalData {
  weight: string
  height: string
  age: string
  alp: string
  creatinine: string
  ldh: string
  triglycerides: string
  uricAcid: string
  wbc: string
  pancreaticAmylase: string
}

const initialData: MedicalData = {
  weight: "",
  height: "",
  age: "",
  alp: "",
  creatinine: "",
  ldh: "",
  triglycerides: "",
  uricAcid: "",
  wbc: "",
  pancreaticAmylase: "",
}

const fields = [
  { key: "weight" as keyof MedicalData, label: "Weight", unit: "kg", placeholder: "e.g., 70" },
  { key: "height" as keyof MedicalData, label: "Height", unit: "m", placeholder: "e.g., 1.75" },
  { key: "age" as keyof MedicalData, label: "Age", unit: "year", placeholder: "e.g., 30" },
  { key: "alp" as keyof MedicalData, label: "ALP", unit: "U/L", placeholder: "e.g., 100" },
  { key: "creatinine" as keyof MedicalData, label: "Creatinine", unit: "mg/dL", placeholder: "e.g., 1.0" },
  { key: "ldh" as keyof MedicalData, label: "LDH", unit: "U/L", placeholder: "e.g., 200" },
  { key: "triglycerides" as keyof MedicalData, label: "Triglycerides", unit: "mg/dL", placeholder: "e.g., 150" },
  { key: "uricAcid" as keyof MedicalData, label: "Uric acid", unit: "mg/dL", placeholder: "e.g., 5.0" },
  { key: "wbc" as keyof MedicalData, label: "White blood cell count", unit: "10³/μL", placeholder: "e.g., 7.0" },
  { key: "pancreaticAmylase" as keyof MedicalData, label: "Pancreatic amylase", unit: "U/L", placeholder: "e.g., 50" },
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
      const value = data[field.key]
      if (value !== "" && (isNaN(Number(value)) || Number(value) <= 0)) {
        setError(`Please enter a valid positive number for ${field.label} or leave it empty`)
        return false
      }
    }
    return true
  }

  const generateTrainingData = () => {
    // Generate sample training data with some missing values (NaN)
    const trainingData = []
    const trainingLabels = []

    for (let i = 0; i < 100; i++) {
      const sample = [
        Math.random() > 0.1 ? Math.random() * 50 + 50 : Number.NaN, // Weight: 50-100 kg (10% missing)
        Math.random() > 0.05 ? Math.random() * 0.5 + 1.5 : Number.NaN, // Height: 1.5-2.0 m (5% missing)
        Math.random() > 0.02 ? Math.random() * 50 + 20 : Number.NaN, // Age: 20-70 years (2% missing)
        Math.random() > 0.15 ? Math.random() * 200 + 50 : Number.NaN, // ALP: 50-250 U/L (15% missing)
        Math.random() > 0.1 ? Math.random() * 2 + 0.5 : Number.NaN, // Creatinine: 0.5-2.5 mg/dL (10% missing)
        Math.random() > 0.12 ? Math.random() * 300 + 100 : Number.NaN, // LDH: 100-400 U/L (12% missing)
        Math.random() > 0.2 ? Math.random() * 200 + 50 : Number.NaN, // Triglycerides: 50-250 mg/dL (20% missing)
        Math.random() > 0.18 ? Math.random() * 5 + 3 : Number.NaN, // Uric acid: 3-8 mg/dL (18% missing)
        Math.random() > 0.08 ? Math.random() * 10 + 4 : Number.NaN, // WBC: 4-14 10³/μL (8% missing)
        Math.random() > 0.25 ? Math.random() * 100 + 20 : Number.NaN, // Pancreatic amylase: 20-120 U/L (25% missing)
      ]

      // Simple synthetic target value (use actual medical outcomes in real applications)
      const nonNanValues = sample.filter((val) => !isNaN(val))
      const target =
        nonNanValues.length > 0
          ? nonNanValues.reduce((sum, val) => sum + val, 0) / nonNanValues.length + Math.random() * 10
          : Math.random() * 50 + 25

      trainingData.push(sample)
      trainingLabels.push(target)
    }

    return { trainingData, trainingLabels }
  }

  const preprocessData = (inputArray: number[]) => {
    // Handle NaN values by replacing them with mean values from training data
    const meanValues = [70, 1.7, 45, 150, 1.2, 250, 150, 5.5, 7.5, 70] // Approximate mean values

    return inputArray.map((value, index) => (isNaN(value) ? meanValues[index] : value))
  }

  const runPrediction = async () => {
    if (!validateInputs()) return;
  
    setIsLoading(true);
    setError("");
  
    try {
      // モデルの読み込み
      const modelData = require('../trained_model/top10_rf_alm_model.json');  
      // Random Forest regression modelのインポート
      const regression = RandomForestRegression.load(modelData);
  
      // 入力データを数値配列に変換し、NaNを空の値として使用
      const inputArray = [
        data.weight === "" ? Number.NaN : Number(data.weight),
        data.height === "" ? Number.NaN : Number(data.height),
        data.age === "" ? Number.NaN : Number(data.age),
        data.alp === "" ? Number.NaN : Number(data.alp),
        data.creatinine === "" ? Number.NaN : Number(data.creatinine),
        data.ldh === "" ? Number.NaN : Number(data.ldh),
        data.triglycerides === "" ? Number.NaN : Number(data.triglycerides),
        data.uricAcid === "" ? Number.NaN : Number(data.uricAcid),
        data.wbc === "" ? Number.NaN : Number(data.wbc),
        data.pancreaticAmylase === "" ? Number.NaN : Number(data.pancreaticAmylase),
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
              This application is a simplified version using LightGBM and a subset of the data. If you are interested in
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
                    {field.label} ({field.unit})
                  </Label>
                  <Input
                    id={field.key}
                    type="number"
                    step="any"
                    placeholder={field.placeholder}
                    value={data[field.key]}
                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                    className="w-full"
                  />
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
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {fields.map((field) => (
                  <div key={field.key} className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">{field.label}</div>
                    <div className="font-semibold">
                      {data[field.key] === "" ? (
                        <span className="text-gray-400">Missing (NaN)</span>
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
