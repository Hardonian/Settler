sed -i 's/error\.message/_error\.message/g' packages/api/src/routes/v1/runs.ts
sed -i 's/String(error)/String(_error)/g' packages/api/src/routes/v1/runs.ts
sed -i 's/error/error/g' packages/api/src/routes/v1/runs.ts
