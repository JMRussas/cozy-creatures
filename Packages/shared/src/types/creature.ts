// Cozy Creatures - Creature Types
//
// Defines creature species and their metadata.
//
// Depends on: nothing
// Used by:    creature constants, player types, client rendering

export interface CreatureDefinition {
  id: string;
  name: string;
  description: string;
  modelPath: string;
  thumbnailPath: string;
  animations: readonly string[];
}
