// Compatibility command. Public MDX is now canonical; never import a private sibling repo.
import { prepareLibrary } from './prepare-public-library.mjs';
prepareLibrary();
