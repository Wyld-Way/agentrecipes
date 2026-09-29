// SDK wiring follows the official MCP TypeScript server quickstart (reviewed 2026-09-29).
// Install @modelcontextprotocol/server and zod in a separate example project first.
// Transport/host smoke testing is still required; catalog.mjs has offline tests.
import { McpServer } from '@modelcontextprotocol/server';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { z } from 'zod';
import { listItems, getItem } from './catalog.mjs';

const server = new McpServer({ name: 'example-catalog', version: '0.1.0' });
const reply = (data) => ({ content: [{ type: 'text', text: JSON.stringify(data) }] });
server.registerTool('list_items', {
  description: 'List published items from this synthetic exhibition catalog. Returns item IDs and titles only.',
  inputSchema: z.object({ limit: z.number().int().min(1).max(10).optional() }),
  annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
}, async (args) => reply(listItems(args)));
server.registerTool('get_item', {
  description: 'Read one published catalog item by the ID returned by list_items. Does not edit or publish.',
  inputSchema: z.object({ id: z.string().regex(/^exhibit-\d+$/) }),
  annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
}, async (args) => reply(getItem(args)));
await server.connect(new StdioServerTransport());
// Never log application messages to stdout in a stdio MCP server.
