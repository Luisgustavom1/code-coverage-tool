import inspector from 'inspector/promises';
import { readFile } from 'node:fs/promises';
import { isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const COLORS = {
    GREEN: "\x1b[32m",
    RED: "\x1b[31m",
    END_LINE: "\x1b[0m"
}

const currentFileName = fileURLToPath(import.meta.url);

const ENTRYPOINT = './example/index.mjs';
const session = new inspector.Session();
session.connect();

await session.post("Profiler.enable");
await session.post("Profiler.startPreciseCoverage", {
    callCount: true,
    detailed: true,
});

await import(ENTRYPOINT);

const preciseCoverage = await session.post("Profiler.takePreciseCoverage");
await session.post("Profiler.stopPreciseCoverage");

const results = filterCoverageResults(preciseCoverage);
for (const coverage of results) {
    const filename = fileURLToPath(coverage.url);
    const sourceCode = await readFile(filename, 'utf-8');
    generateCoverageReport(
        filename,
        sourceCode,
        coverage.functions,
    );
}

function filterCoverageResults(coverage) {
    return coverage.result.filter(({ url }) => {
        const findUrl = url.replace("file://", "");
        return isAbsolute(findUrl) && findUrl !== currentFileName;
    })
}

function generateCoverageReport(filename, sourceCode, functions) {
    const uncoveredLine = new Map();
    
    for (const func of functions) {
        for (const range of func.ranges) {
            if (range.count !== 0) continue;

            const startLine = sourceCode.substring(0, range.startOffset + 1).split("\n").length;
            const endLine = sourceCode.substring(0, range.endOffset).split("\n").length;
            for (let lineIndex = startLine; lineIndex <= endLine; lineIndex++) {
                uncoveredLine.set(lineIndex, lineIndex);
            }
        }
    }

    console.log("\n" + COLORS.GREEN + filename + COLORS.END_LINE);
    sourceCode.split('\n').forEach((line, index) => {
        if (uncoveredLine.has(index + 1)) {
            console.log(COLORS.RED + line + COLORS.END_LINE);
            return;
        };
        
        console.log(line);
    })
}