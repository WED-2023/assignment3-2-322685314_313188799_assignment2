var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");
const user_utils = require("./utils/user_utils");


//TODO: TEST WATCHED AND FAFORITED FOR THIS FUNCTION  
/**
 * This is in the home page - returns a 3 random preview-recipes
 */
router.get("/", async (req, res, next) => {
    try {
    const random_recipes = await recipes_utils.get3RandomPreviwe();
    // Add user-specific info if logged in
    if (req.session && req.session.user_id){
      for (const random of random_recipes){
        random.isFavoriteByUser = await user_utils.isFavoriteByUser(req.session.user_id, random.id);
        if (req.session.watchedRecipesIDs && req.session.watchedRecipesIDs.includes(random.id)) 
          random.isWatched = true;
      }
    }
    res.send(random_recipes);
  } 
  catch (error) {next(error);}
});

/**
 * This path returns a full details of a recipe by its id
 */
router.get("/:recipeId", async (req, res, next) => {
  try {
    const recipe = await recipes_utils.getRecipeDetails(req.params.recipeId);
    // Add user-specific info if logged in
    if (req.session && req.session.user_id){
        recipe.isFavoriteByUser = await user_utils.isFavoriteByUser(req.session.user_id, recipe.id);
        if (req.session.watchedRecipesIDs && req.session.watchedRecipesIDs.includes(recipe.id)) 
          random.isWatched = true;
      }
    res.send(recipe);
  } catch (error) {
    next(error);
  }
});


module.exports = router;
