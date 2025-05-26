var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");
const user_utils = require("./utils/user_utils");


/**
 * This is in the home page - returns a 3 random preview-recipes
 */
router.get("/", async (req, res, next) => {
    try {
    const random_recipes = await user_utils.completeUserSpecificPreview(req.session, await recipes_utils.get3RandomPreviwe());    
    res.send(random_recipes);
  } 
  catch (error) {next(error);}
});


router.get("/search", async (req, res, next) => {
 try {
    const { query, cuisine, diet, intolerance, limit = 5, sort } = req.query;
    const intoleranceArray = intolerance ? intolerance.split(",") : [];

    const results_from_utils = await recipes_utils.searchRecipes(
      query, {
      cuisine,
      diet,
      intolerance: intoleranceArray,
      limit: parseInt(limit),
      sort,
    });

    if (req.session && req.session.user_id){
      req.session.last_search = results_from_utils;
    } 

    const results_preview = await user_utils.completeUserSpecificPreview(req.session, await recipes_utils.getRecipesPreview(results_from_utils));
    res.status(200).send(results_preview);
  } catch (err) {
    next(err);
  }
});

router.get("/LastSearched", async (req, res, next) => {
  try{
    if (!req.session || !req.session.user_id){
      res.status(401).send("Unauthorized: user not found");
    } 
    const recipeIDs = req.session.last_search;
    const last_searched_preview = await user_utils.completeUserSpecificPreview(req.session, await recipes_utils.getRecipesPreview(recipeIDs));
    res.status(200).send(last_searched_preview);
  } catch(error){
    next(error); 
  }
});

router.post("/like/:recipeID", async (req, res, next) => {
  try{
    if (!req.session || !req.session.user_id){
      res.status(401).send("Unauthorized: user not found");
    } 
    await recipes_utils.increaseRecipeLikes(req.params.recipeID);
    res.sendStatus(200);
  } catch(error){
    next(error); 
  }
});

/**
 * This path returns a full details of a recipe by its id
 */
router.get("/:recipeId", async (req, res, next) => {
  try {
    let recipe = await recipes_utils.getRecipeDetails(req.params.recipeId);
    // Add user-specific info if logged in
    recipe = (await user_utils.completeUserSpecificPreview(req.session, [recipe]))[0];
    res.send(recipe);
  } catch (error) {
    next(error);
  }
});



module.exports = router;
