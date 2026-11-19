import fs from 'fs';
import path from 'path';
import { PlaceholderService } from '../services/PlaceholderService';

// The extension reads these files live from the main branch, so a broken file reaches every user at once.
const actionsDir = path.resolve(__dirname, '../../predefined-actions');
const files = fs.readdirSync(actionsDir).filter(file => file.endsWith('.json'));

const readActions = (file: string): any[] =>
    JSON.parse(fs.readFileSync(path.join(actionsDir, file), 'utf8').replace(/^﻿/, ''));

describe('predefined-actions', () => {
    const placeholderService = new PlaceholderService();

    it('contains action files', () => {
        expect(files.length).toBeGreaterThan(0);
    });

    it('uses unique ids across all files', () => {
        const ids = files.flatMap(file => readActions(file).map(action => action.id));
        const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
        expect(duplicates).toEqual([]);
    });

    describe.each(files)('%s', (file) => {
        let actions: any[];

        beforeAll(() => {
            actions = readActions(file);
        });

        it('is a non-empty array', () => {
            expect(Array.isArray(actions)).toBe(true);
            expect(actions.length).toBeGreaterThan(0);
        });

        it('has well-formed actions', () => {
            for (const action of actions) {
                const label = `${file} > ${action.title}`;
                expect({ label, id: typeof action.id, title: typeof action.title, actionJson: typeof action.actionJson })
                    .toEqual({ label, id: 'string', title: 'string', actionJson: 'string' });

                const parsed = JSON.parse(action.actionJson);
                expect({ label, type: typeof parsed.operationDefinition?.type }).toEqual({ label, type: 'string' });
            }
        });

        it('uses a valid minExtensionVersion where set', () => {
            const invalid = actions
                .filter(action => action.minExtensionVersion !== undefined && !/^\d+(\.\d+)*$/.test(String(action.minExtensionVersion)))
                .map(action => action.title);
            expect(invalid).toEqual([]);
        });

        it('keeps descriptions within the Power Automate limit and free of placeholders', () => {
            const problems: string[] = [];
            const check = (node: unknown, title: string) => {
                if (Array.isArray(node)) {
                    node.forEach(item => check(item, title));
                } else if (node && typeof node === 'object') {
                    for (const [key, value] of Object.entries(node)) {
                        if (key === 'description' && typeof value === 'string') {
                            if (value.length > 256) problems.push(`${title}: ${value.length} characters`);
                            if (/\{\{[A-Z][A-Z0-9_]*\}\}/.test(value)) problems.push(`${title}: contains a placeholder`);
                        } else {
                            check(value, title);
                        }
                    }
                }
            };
            for (const action of actions) {
                check(JSON.parse(action.actionJson), action.title);
            }
            expect(problems).toEqual([]);
        });

        it('uses valid placeholder names', () => {
            for (const action of actions) {
                const names = Array.from(action.actionJson.matchAll(/\{\{([^}]*)\}\}/g), (match: RegExpMatchArray) => match[1]);
                const invalid = names.filter(name => !/^[A-Z][A-Z0-9_]*$/.test(name));
                expect({ action: action.title, invalid }).toEqual({ action: action.title, invalid: [] });
            }
        });

        it('produces a valid action once placeholders are filled', () => {
            for (const action of actions) {
                const keys = placeholderService.extractPlaceholders(action.actionJson);
                const defaults = placeholderService.getDefaultValues(keys, {});
                // "1" is valid JSON both inside a string literal and in a bare value position.
                const values = Object.fromEntries(keys.map(key => [key, defaults[key] || '1']));
                const filled = placeholderService.substitutePlaceholders(action.actionJson, values);
                expect({ action: action.title, error: placeholderService.validateFilledAction(filled) })
                    .toEqual({ action: action.title, error: null });
            }
        });
    });
});
