import { NextRequest, NextResponse } from 'next/server';
import * as ort from 'onnxruntime-node';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const inputArray = body.data;
    if (!Array.isArray(inputArray)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    // モデルファイルのパス
    const modelPath = path.join(process.cwd(), 'public', 'trained_model', 'lightgbm_model.onnx');
    // ONNXモデルのセッション作成
    const session = await ort.InferenceSession.create(modelPath);
    // 入力テンソル作成
    const inputTensor = new ort.Tensor('float32', Float32Array.from(inputArray), [1, inputArray.length]);
    // 入力名はモデルによって異なる場合があるので、最初の入力名を取得
    const inputName = session.inputNames[0];
    const feeds = { [inputName]: inputTensor };
    // 推論実行
    const results = await session.run(feeds);
    // 最初の出力名で結果を取得
    const outputName = session.outputNames[0];
    const prediction = results[outputName].data[0];
    return NextResponse.json({ prediction });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
} 