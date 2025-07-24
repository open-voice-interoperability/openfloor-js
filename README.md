<img src="https://github.com/open-voice-interoperability/artwork/blob/main/horizontal/color/Interoperability_Logo_color.png" width="300" alt="Open Floor Protocol Logo">

# Open Floor Protocol (OFP)

[![npm version](https://img.shields.io/npm/v/@openfloor/protocol.svg)](https://www.npmjs.com/package/@openfloor/protocol)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/github/license/open-voice-interoperability/openfloor-js)](LICENSE)
[![Docs](https://img.shields.io/badge/docs-typedoc-blue)](https://open-voice-interoperability.github.io/openfloor-js/)

---

> **A TypeScript library for the [Open Floor Protocol (OFP)](https://github.com/open-voice-interoperability/docs), enabling interoperable, multi-agent conversational AI.**

---

## Table of Contents
- [Overview](#overview)
- [Installation](#installation)
- [Usage](#usage)
- [Protocol Overview](#protocol-overview)
- [Testing & Development](#testing--development)

---

## Overview

The Open Floor Protocol (OFP) is an open standard for multi-agent, multi-party conversational AI interoperability. This library provides a complete, rigorously tested TypeScript implementation of the OFP specifications, including:
- **Conversation Envelope** (message container)
- **Dialog Event** (utterances, context, etc.)
- **Assistant Manifest** (agent capabilities/identity)
- **Agent behaviors** (bot, floor manager, convener)

---

## Installation

```sh
npm install @openfloor/protocol
```

---

## Usage

You can find more examples and full tutorials on [openfloor.dev](https://openfloor.dev).

### Create a Text Utterance Event
```typescript
import { createTextUtterance } from '@openfloor/protocol';

const utterance = createTextUtterance({
  speakerUri: 'tag:example.com,2025:user1',
  text: 'Hello world',
  to: { speakerUri: 'tag:example.com,2025:bot1' }
});
```

### Create a Basic Agent Manifest
```typescript
import { createBasicManifest } from '@openfloor/protocol';

const manifest = createBasicManifest({
  speakerUri: 'tag:example.com,2025:bot1',
  serviceUrl: 'https://example.com/bot',
  name: 'Assistant',
  organization: 'Example Corp',
  description: 'A helpful assistant',
  capabilities: ['chat', 'help']
});
```

### Create a Conversation Envelope
```typescript
import { createSimpleEnvelope } from '@openfloor/protocol';

const envelope = createSimpleEnvelope({
  conversationId: 'conv:123',
  senderUri: 'tag:example.com,2025:bot1',
  events: [utterance]
});
```

### Validate and Parse a Payload
```typescript
import { validateAndParsePayload } from '@openfloor/protocol';

const jsonString = JSON.stringify({ openFloor: envelope });
const result = validateAndParsePayload(jsonString);
if (result.valid) {
  console.log('Payload is valid:', result.payload);
} else {
  console.error('Validation errors:', result.errors);
}
```

---

## Protocol Overview

- **OFP** enables seamless, cross-platform communication between human users and autonomous agents.
- **Conversation Envelope:** Universal JSON structure for agent-to-agent and agent-to-user messages.
- **Dialog Event:** Standardized structure for utterances, context, and features.
- **Assistant Manifest:** Machine-readable agent identity and capabilities.

**Specifications:**
- [Open Floor Inter-Agent Message Specification 1.0.0](https://github.com/open-voice-interoperability/docs/blob/main/specifications/ConversationEnvelope/1.0.0/InteroperableConvEnvSpec.md)
- [Dialog Event Object Specification 1.0.2](https://github.com/open-voice-interoperability/docs/blob/main/specifications/DialogEvents/1.0.2/InteropDialogEventSpecs.md)
- [Assistant Manifest Specification 1.0.0](https://github.com/open-voice-interoperability/docs/blob/main/specifications/AssistantManifest/1.0.0/AssistantManifestSpec.md)

**Schemas:**
- [Envelope Schema](./schemas/conversation-envelope/1.0.0/conversation-envelope-schema.json)
- [Dialog Event Schema](./schemas/dialog-event/1.0.2/dialog-event-schema.json)
- [Assistant Manifest Schema](./schemas/assistant-manifest/1.0.0/assistant-manifest-schema.json)


---

## Testing & Development

- **Run tests:**
  ```sh
  npm test
  ```
- **Build:**
  ```sh
  npm run build
  ```
- **Generate docs:**
  ```sh
  npm run docs
  ```