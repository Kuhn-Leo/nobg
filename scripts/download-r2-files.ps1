# 下载 R2 自托管所需的模型文件包（~130MB）
# 用法：powershell -File scripts/download-r2-files.ps1
$ErrorActionPreference = "Stop"
$base = "https://staticimgly.com/@imgly/background-removal-data/1.5.5/dist"
$dest = Join-Path $PSScriptRoot "..\r2-upload"

$files = @(
  "resources.json",
  "models/isnet_quint8",
  "onnxruntime-web/ort-wasm.wasm",
  "onnxruntime-web/ort-wasm-threaded.wasm",
  "onnxruntime-web/ort-wasm-simd.wasm",
  "onnxruntime-web/ort-wasm-simd.jsep.wasm",
  "onnxruntime-web/ort-wasm-simd-threaded.wasm",
  "onnxruntime-web/ort-wasm-simd-threaded.jsep.wasm",
  "onnxruntime-web/ort-training-wasm-simd.wasm"
)

foreach ($f in $files) {
  $target = Join-Path $dest $f
  if (Test-Path $target) { Write-Host "skip (exists): $f"; continue }
  $dir = Split-Path $target
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
  Write-Host "downloading: $f ..."
  Invoke-WebRequest -Uri "$base/$f" -OutFile $target -UseBasicParsing -TimeoutSec 600
  $size = (Get-Item $target).Length
  Write-Host ("  done: {0:N0} bytes" -f $size)
}
Write-Host "ALL DONE. Upload the CONTENTS of r2-upload/ to the R2 bucket."
