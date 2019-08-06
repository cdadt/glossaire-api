import Word from '../models/word';

/**
 * Méthode qui permet d'utiliser une ligne pour importer une définition.
 */
const importOneDefinition = async (line) => {
  await Word.create(line);
};

/**
 * Méthode pour import les définitions.
 */
export const importDefinitions = (rows) => {
  for (let i = 0; i < rows.length; i += 1) {
    importOneDefinition(rows[i]);
  }
}

export default importDefinitions;
