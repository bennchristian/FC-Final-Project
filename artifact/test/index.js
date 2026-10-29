// Entry point for the check command `node --test artifact/test/`: Node resolves a
// directory argument to this file, so it loads every test file in the folder.
import './conformance.test.mjs';
import './content.test.mjs';
import './guard.test.mjs';
import './pipeline.test.mjs';
import './export.test.mjs';
import './reel.test.mjs';
import './copy-edits.test.mjs';
import './sample.test.mjs';
