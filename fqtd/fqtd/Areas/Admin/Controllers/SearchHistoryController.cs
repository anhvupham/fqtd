using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Dynamic;
using System.Web;
using System.Web.Mvc;
using fqtd.Areas.Admin.Models;
using PagedList;

namespace fqtd.Areas.Admin.Controllers
{
    public class SearchHistoryController : Controller
    {
        //
        // GET: /Admin/SearchHistory/
        fqtd.Areas.Admin.Models.fqtdEntities db = new Models.fqtdEntities();
        [Authorize]
        [OutputCache(CacheProfile = "Aggressive", VaryByParam = "page;keyword;CategoryID;BrandID", Location = System.Web.UI.OutputCacheLocation.Client)]
        public ActionResult Index(string keyword = "", int? CategoryID = null, int? BrandID = null, int page = 1)
        {
            var result = from a in db.SearchHistory where (a.Keyword.Contains(keyword)) select a;
            if (CategoryID != null)
                result = result.Where(a => a.CategoryID == CategoryID);
            if (BrandID != null)
                result = result.Where(a => a.BrandID == BrandID);
            result = result.OrderByDescending(a=>a.SearchTime);
            ViewBag.CurrentKeyword = keyword;
            int maxRecords = 20;
            int currentPage = page;
            ViewBag.CurrentPage = page;
            ViewBag.CurrentCategoryID = CategoryID;
            ViewBag.CurrentBrandID = BrandID;
            ViewBag.CategoryID = new SelectList(db.Categories, "CategoryID", "CategoryName");
            ViewBag.BrandID = new SelectList(db.Brands, "BrandID", "BrandName");


            return View(result.ToPagedList(currentPage, maxRecords));

            //return View(db.SearchHistory.OrderByDescending(a=>a.SearchTime).ToList());
        }
        [Authorize]
        public ActionResult SearchByMode(int page = 1)
        {
            var result = db.SP_SearchByMode();

            //result = result.OrderBy("Keyword");
            int maxRecords = 20;
            int currentPage = page;
            ViewBag.CurrentPage = page;
            return View(result);//.ToPagedList(currentPage, maxRecords));

            //return View(db.SearchHistory.OrderByDescending(a=>a.SearchTime).ToList());
        }
        [Authorize]
        public ActionResult SearchByBrand(int page = 1)
        {
            var result = db.SP_SearchByBrand();

            //result = result.OrderBy("Keyword");
            int maxRecords = 20;
            int currentPage = page;
            ViewBag.CurrentPage = page;
            return View(result);//.ToPagedList(currentPage, maxRecords));

            //return View(db.SearchHistory.OrderByDescending(a=>a.SearchTime).ToList());
        }
        [Authorize]
        public ActionResult SearchByKeyword(int page = 1)
        {
            var result = db.SP_SearchByKeyword();

            //result = result.OrderBy("Keyword");
            int maxRecords = 20;
            int currentPage = page;
            ViewBag.CurrentPage = page;
            return View(result);//.ToPagedList(currentPage, maxRecords));

            //return View(db.SearchHistory.OrderByDescending(a=>a.SearchTime).ToList());
        }
        [Authorize]
        public ActionResult SearchByCategory(int page = 1)
        {
            var result = db.SP_SearchByCategory();

            //result = result.OrderBy("Keyword");
            int maxRecords = 20;
            int currentPage = page;
            ViewBag.CurrentPage = page;
            return View(result);//.ToPagedList(currentPage, maxRecords));

            //return View(db.SearchHistory.OrderByDescending(a=>a.SearchTime).ToList());
        }
    }
}
