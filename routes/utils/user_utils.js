const DButils = require("./DButils");

async function markAsFavorite(user_id, recipe_id){
    await DButils.execQuery(`insert into user_favorited_recipes values ('${recipe_id}',${user_id})`);
}

async function getFavoriteRecipes(user_id){
    const recipes_id = await DButils.execQuery(`select SpoonRecipeID from user_favorited_recipes where userID=${user_id}`);
    return recipes_id;
}


async function isFavoriteByUser(user_id, recipe_id){
    const result = await DButils.execQuery(
      `SELECT * FROM user_favorited_recipes WHERE userID = ${user_id} AND SpoonRecipeID = '${recipe_id}'`
    );
    return result.length > 0;
}

// Add user-specific info if logged in
// given an *array* of preview recipe details - specify isFavoriteByUser and isWatched flags for logged-in user
async function completeUserSpecificPreview(session, recipes_preview_info) {
  // parse each id to Number (instead of string)
  const current_watched_array = session.watchedRecipesIDs?.map(Number) || [];
  if (session && session.user_id){
    for (const recipe of recipes_preview_info){
      recipe.isFavoriteByUser = await isFavoriteByUser(session.user_id, recipe.id);
      recipe.isWatched = current_watched_array.includes(recipe.id);
    }
  }
  return recipes_preview_info;
}

async function removeFavoriteRecipe(user_id, recipe_id) {
  await DButils.execQuery(
    `DELETE FROM user_favorited_recipes WHERE userID = ${user_id} AND SpoonRecipeID = '${recipe_id}'`
  );
}

async function createNewRecipe(user_id, recipe_details) {
  const {
    title,
    readyInMinutes,
    image,
    popularity,
    vegan,
    vegetarian,
    glutenFree,
    extendedIngredients,
    instructions,
    servings,
  } = recipe_details;

  const result = await DButils.execQuery(`
    SELECT MAX(CAST(SUBSTRING(recipeID, 3) AS UNSIGNED)) AS maxID
    FROM recipes
    WHERE recipeID LIKE 'U_%'
  `);
  const maxID = result[0].maxID || 0;
  const newID = `U_${maxID + 1}`;

  await DButils.execQuery(`
    INSERT INTO recipes (
      recipeID, title, readyInMinutes, image, popularity,
      vegan, vegetarian, glutenFree, extendedIngredients,
      instructions, servings, userID
    )
    VALUES (
      '${newID}',
      '${title}',
      ${readyInMinutes},
      '${image}',
      ${popularity},
      ${vegan},
      ${vegetarian},
      ${glutenFree},
      '${JSON.stringify(extendedIngredients)}',
      '${instructions}',
      ${servings},
      ${user_id}
    )
  `);
  return { success: true, recipeID: newID };
}


/*Retrive all user's recipes*/
async function getUserRecipes(user_id) {
  const recipes_id = await DButils.execQuery(`SELECT CAST(SUBSTRING(recipeID, 3) AS UNSIGNED) AS recipe_num FROM recipes WHERE userID = ${user_id}`);
  return recipes_id
}


/*Retrive all user's recipes*/
async function removeUserRecipe(recipeID) {
  await DButils.execQuery(`DELETE FROM recipes WHERE recipeID = '${recipeID}';`);
}

exports.markAsFavorite = markAsFavorite;
exports.getFavoriteRecipes = getFavoriteRecipes;
exports.isFavoriteByUser = isFavoriteByUser;
exports.completeUserSpecificPreview = completeUserSpecificPreview;
exports.removeFavoriteRecipe = removeFavoriteRecipe;
exports.createNewRecipe = createNewRecipe;
exports.getUserRecipes = getUserRecipes;
exports.removeUserRecipe = removeUserRecipe;