# Worldbuilder (Claude Desktop / Claude Code)

The Worldbuilder lets Claude Desktop or Claude Code read your campaign notes and
write **drafts** into one campaign: people, places, shops, factions, facts,
links, story threads and beats, job flyers and notices, monster templates,
random tables, and suggested edits to existing text.

Drafts never touch the game. They sit on the DM's **Worldbuilder** page (Prep)
until you approve them, and approving adds them **Hidden**: nothing reaches the
TV, a phone, a counter, search or a link until you reveal it yourself.

A builder key can never: change game state (money, Renown, fights, players,
Discovery stages, job status), reveal, publish, pin, approve, delete, change
settings or keys, read players' real names or sign-in details, or upload images.

## 1. Make a key

1. DM view, **Settings → Worldbuilder**.
2. Turn on **Builder access**. It starts off for every campaign, and turning it
   off stops every key at once (the kill switch).
3. Give the key a label (e.g. "Claude Desktop laptop"), pick an expiry (30 days
   by default) and, if you like, tick **No secrets or DM notes** so the key can't
   read secrets, DM notes, wants/knows or job DM notes.
4. Press **New key** and copy it. **It is shown once.** Only a hash is kept, so
   a lost key can't be recovered: revoke it and make a new one.

A key looks like `cfb_<campaign>_<id>_<64 hex>` and works for that one campaign
only. Builder keys and the DM key are separate: neither opens the other's door.

## 2. Build the MCP server

You need Node 20 or newer.

```sh
cd mcp/worldbuilder
npm ci
npm run build
```

This makes `mcp/worldbuilder/dist/index.js`, a local stdio MCP server. It talks
only to your Dungeon Garden site over HTTPS, sending the key in the
`Authorization` header.

## 3. Add it to Claude Desktop

Settings → Developer → Edit Config, then add this to `claude_desktop_config.json`
(that file lives in your user folder, **not** in this repository):

```json
{
  "mcpServers": {
    "dungeon-garden-worldbuilder": {
      "command": "node",
      "args": ["/path/to/DnDBeyondTheWick/mcp/worldbuilder/dist/index.js"],
      "env": {
        "DUNGEON_GARDEN_URL": "https://your-dungeon-garden-site.example",
        "DUNGEON_GARDEN_BUILDER_KEY": "cfb_PASTE_YOUR_KEY_HERE"
      }
    }
  }
}
```

Restart Claude Desktop. Ask it to "read the campaign overview" to check it works.

A config from before the rename, with `CANDLEFAIR_URL` and `CANDLEFAIR_BUILDER_KEY`, still works.

## 3b. Or add it to Claude Code

```sh
claude mcp add dungeon-garden-worldbuilder \
  -e DUNGEON_GARDEN_URL=https://your-dungeon-garden-site.example \
  -e DUNGEON_GARDEN_BUILDER_KEY=cfb_PASTE_YOUR_KEY_HERE \
  -- node /path/to/DnDBeyondTheWick/mcp/worldbuilder/dist/index.js
```

Use the default (local) scope so the key stays in your own Claude config and
out of `.mcp.json` in the repository.

## 4. Never commit a key

- Never paste a key into a file inside this repository, a commit, an issue or a
  chat you share.
- `.gitignore` already ignores `.env*`, `*.local.json`, `*.local.mjs` and
  `claude_desktop_config.json`. Keep it that way.
- If a key leaks, **revoke it** (Worldbuilder box → Revoke). It stops working on
  the next call. If you're unsure which key, switch **Builder access** off.

## 5. Your style guide

The **Builder notes** tab on the Worldbuilder page is your style guide: tone,
naming rules, what to avoid, what's canon. `get_overview` returns it first and
the server tells Claude to follow it.

## 6. Reviewing drafts

The Worldbuilder page groups drafts by session. For each one: **Approve**,
**Edit** then approve, or **Reject**; or tick several and do them in bulk.
Suggested edits show the old and new text side by side. Approving a draft
also approves any draft it depends on (a fact pulls in its new person).
If the text a suggestion changes was edited after the suggestion was made,
approving fails and asks you to look again.

## 7. Tools

| Tool | What it does |
| --- | --- |
| `get_overview` | Style guide, counts, threads, Renown, recent drafts, limits |
| `search` | Search entries, beats, flyers, monsters, tables, shop items (max 25) |
| `get_entry` | One thing in full by id (a shop entry lists its items; shop items are read-only) |
| `list_characters` | Character names, levels, parties, backstory threads (no real names) |
| `list_threads`, `list_beats` | The storyboard |
| `create_entry` | Person, place, shop, monster, mystery or faction (Hidden draft) |
| `add_fact`, `link_entries` | Facts and links (on real entries or your drafts) |
| `create_thread`, `create_beat` | Storyboard drafts |
| `create_flyer` | Job flyer or notice, never pinned |
| `create_monster_template` | Monster template |
| `create_random_table` | d4–d100 table |
| `suggest_change` | Edit one text field of existing content, as a diff |
| `upload_picture` | A portrait or picture (JPEG, PNG or WebP, up to 3 MB) for an entry or an entry draft; approving puts it on the entry |
| `list_my_drafts`, `update_my_draft`, `withdraw_my_draft` | Manage your own pending drafts |

Everything read back from the campaign is wrapped as `campaign_text` and marked
as data, not instructions. Tip: run Worldbuilder sessions without web browsing
or other tools that could carry outside text into your campaign.

## 8. Limits

Per key: 20 calls a minute, 600 reads an hour, 60 writes an hour, 300 writes a
day, and at most 200 drafts waiting for review per campaign. A draft is at most
16 KB and a request at most 64 KB. All text is cleaned of control characters and
shown as plain text.

## 9. Activity

The **Activity** list in the Worldbuilder box shows every call each key made
(never the key or full text), with refused calls highlighted. Lots of refused
calls can mean a key leaked: revoke it.

## Pictures

`upload_picture` takes a file path (or base64) and the entry it's for: an id
from `search`, or a pending entry draft (`bd_...`). Without the MCP server, send
the raw image as the body of `POST /api/builder/upload_picture` with
`Content-Type: image/jpeg` (or png/webp), the entry in `x-builder-entry` and
optional alt text, URI-encoded, in `x-builder-alt`.

The file is stored as one of the campaign's own uploads (it counts toward the
campaign's image space) and becomes a Picture draft. It shows on the review page
on the entry it's for; approving that entry approves the picture with it.
Approving puts it on the entry as its portrait, unshown: players don't see it
until the DM shows it on the TV. A new upload for the same entry replaces the
key's earlier pending picture. Pictures can't be edited, only approved or
rejected.
