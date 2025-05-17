const DButils = require("./DButils");

async function markAsFavorite(user_id, recipe_id){
    await DButils.execQuery(`insert into user_favorited_recipes values ('${user_id}',${recipe_id})`);
}

async function getFavoriteRecipes(user_id){
    const recipes_id = await DButils.execQuery(`select recipeID from user_favorited_recipes where userID='${user_id}'`);
    return recipes_id;
}


async function isFavoriteByUser(user_id, recipe_id){
    const result = await DButils.execQuery(
      `SELECT * FROM user_favorited_recipes WHERE userID = '${user_id}' AND recipeID = '${recipe_id}'`
    );
    return result.length > 0;
}




exports.markAsFavorite = markAsFavorite;
exports.getFavoriteRecipes = getFavoriteRecipes;
exports.isFavoriteByUser = isFavoriteByUser;