using System.Data.Entity.Validation;
using System.Linq;
using System.Linq.Dynamic;
using System.Web;
using System.Web.Mvc;
using System.Web.Security;
using fqtd.Utils;
using fqtd.Areas.Admin.Models;
using Newtonsoft.Json;
using PagedList;
using System.Configuration;
using System.Data;
using System;
using System.IO;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using System.Text;

namespace fqtd.Areas.Admin.Controllers
{
    public class ItemsController : Controller
    {
        private fqtdEntities db = new fqtdEntities();

        //
        // GET: /Admin/Items/
        //[OutputCache(CacheProfile = "Aggressive", VaryByParam = "page;keyword;CategoryID;BrandID", Location = System.Web.UI.OutputCacheLocation.Client)]
        [Authorize()]
        public ActionResult Index(string sortOrder = "", string keyword = "", int? CategoryID = null, int? BrandID = null, bool? isShow = null, string CreateUser = "", int page = 1)
        {

            var result = from a in db.BrandItems where (a.ItemName.Contains(keyword) || a.ItemName_EN.Contains(keyword)) select a;
            if (CategoryID != null)
                result = result.Where(a => a.tbl_Brands.CategoryID == CategoryID);
            if (BrandID != null)
                result = result.Where(a => a.BrandID == BrandID);
            if (isShow != null)
                result = result.Where(a => a.IsShow == isShow.Value);
            if (CreateUser + "" != "")
                result = result.Where(a => a.CreateUser == CreateUser);

            ViewBag.ItemName = sortOrder == "ItemName" ? "ItemName desc" : "ItemName";
            ViewBag.BrandName = sortOrder == "tbl_Brands.BrandName" ? "tbl_Brands.BrandName desc" : "tbl_Brands.BrandName";

            if (sortOrder == "")
                result = result.OrderBy("ItemName");
            else result = result.OrderBy(sortOrder);
            ViewBag.CurrentSortOrder = sortOrder;
            ViewBag.CurrentKeyword = keyword;
            int maxRecords = 20;
            int currentPage = page;
            ViewBag.CurrentPage = page;
            ViewBag.CurrentCategoryID = CategoryID;
            ViewBag.CurrentBrandID = BrandID;
            ViewBag.CurrentCreateUser = CreateUser;
            ViewBag.CurrentIsShow = isShow;
            ViewBag.CategoryID = new SelectList(db.Categories.Where(a => a.IsActive).OrderBy(a => a.CategoryName), "CategoryID", "CategoryName");
            ViewBag.BrandID = new SelectList(db.Brands.Where(a => a.IsActive).OrderBy(a => a.BrandName), "BrandID", "BrandName");

            ViewBag.CreateUser = new SelectList((from a in db.BrandItems select new { a.CreateUser }).Distinct(), "CreateUser", "CreateUser");

            ViewBag.ItemCount = result.Count();
            TempData["sortOrder"] = sortOrder;
            TempData["CategoryID"] = CategoryID;
            TempData["BrandID"] = BrandID;
            TempData["CurrentKeyword"] = keyword;
            TempData["CurrentPage"] = page;
            TempData["CurrentCreateUser"] = CreateUser;
            TempData["CurrentIsShow"] = isShow;
            return View(result.ToPagedList(currentPage, maxRecords));
        }
        public ActionResult GetStreet()
        {
            var items = (from a in db.BrandItems where a.Street != null select a.Street).Distinct();
            JsonNetResult jsonNetResult = new JsonNetResult();
            jsonNetResult.Formatting = Formatting.None;
            jsonNetResult.Data = items;
            return jsonNetResult;
        }
        public ActionResult GetDistrict()
        {
            var items = (from a in db.BrandItems where a.District != null select a.District).Distinct();
            JsonNetResult jsonNetResult = new JsonNetResult();
            jsonNetResult.Formatting = Formatting.None;
            jsonNetResult.Data = items;
            return jsonNetResult;
        }
        public ActionResult GetCity()
        {
            var items = (from a in db.BrandItems where a.City != null select a.City).Distinct();
            JsonNetResult jsonNetResult = new JsonNetResult();
            jsonNetResult.Formatting = Formatting.None;
            jsonNetResult.Data = items;
            return jsonNetResult;
        }
        //
        // GET: /Admin/Items/Details/5
        [Authorize]
        public ActionResult Details(int id = 0)
        {

            BrandItems branditems = db.BrandItems.Find(id);
            if (branditems == null)
            {
                return HttpNotFound();
            }
            return View(branditems);
        }

        //
        // GET: /Admin/Items/Create
        [Authorize]
        public ActionResult Create()
        {
            ViewBag.BrandID = new SelectList(db.Brands.Where(a => a.IsActive).OrderBy(a => a.BrandName), "BrandID", "BrandName");
            return View();
        }

        //
        // POST: /Admin/Items/Create
        [Authorize]
        [HttpPost, ValidateInput(false)]
        [ValidateAntiForgeryToken]
        public ActionResult Create(BrandItems branditems, HttpPostedFileBase icon)
        {
            if (db.BrandItems.Where(a => a.IsActive && (a.ItemName == branditems.ItemName || a.ItemName_EN == branditems.ItemName_EN)).Count() > 0)
            {
                ModelState.AddModelError("CategoryName", "Already Exists Item name");
            }
            else if (ModelState.IsValid)
            {
                branditems.IsActive = true;
                branditems.CreateDate = DateTime.Now;
                branditems.CreateUser = User.Identity.Name;
                string filesPath = "", full_path = "";
                if (icon != null)
                {
                    char DirSeparator = System.IO.Path.DirectorySeparatorChar;
                    filesPath = ConfigurationManager.AppSettings["ItemMarkerIconLocation"];
                    full_path = Server.MapPath(filesPath).Replace("Brands", "").Replace("Admin", "");
                    branditems.MarkerIcon = FileUpload.UploadFile(icon, full_path);
                }
                db.BrandItems.Add(branditems);
                db.SaveChanges();
                if (icon != null)
                {
                    string filename = branditems.ItemID + "_" + icon.FileName.Replace(" ", "_").Replace("-", "_");
                    branditems.MarkerIcon = FileUpload.UploadFile(icon, filename, full_path);
                    db.Entry(branditems).State = EntityState.Modified;
                    db.SaveChanges();
                }
                return RedirectToAction("Index", new { keyword = TempData["CurrentKeyword"], CategoryID = TempData["CategoryID"], BrandID = TempData["BrandID"], page = TempData["CurrentPage"], UserCreate = TempData["CurrentCreateUser"], IsShow = TempData["CurrentIsShow"] });
            }

            ViewBag.BrandID = new SelectList(db.Brands.Where(a => a.IsActive).OrderBy(a => a.BrandName), "BrandID", "BrandName", branditems.BrandID);
            return View(branditems);
        }

        //
        // GET: /Admin/Items/Edit/5
        [Authorize]
        public ActionResult Edit(int id = 0)
        {
            BrandItems branditems = db.BrandItems.Find(id);
            if (branditems == null)
            {
                return HttpNotFound();
            }
            ViewBag.BrandID = new SelectList(db.Brands.Where(a => a.IsActive).OrderBy(a => a.BrandName), "BrandID", "BrandName", branditems.BrandID);
            return View(branditems);
        }

        //
        // POST: /Admin/Items/Edit/5
        [Authorize]
        [HttpPost, ValidateInput(false)]
        [ValidateAntiForgeryToken]
        public ActionResult Edit(BrandItems branditems, HttpPostedFileBase icon)
        {
            if (db.BrandItems.Where(a => a.IsActive && a.BrandID != branditems.BrandID && (a.ItemName == branditems.ItemName || a.ItemName_EN == branditems.ItemName_EN)).Count() > 0)
            {
                ModelState.AddModelError("CategoryName", "Already Exists Item name");
            }
            else if (ModelState.IsValid)
            {
                branditems.ModifyDate = DateTime.Now;
                branditems.ModifyUser = User.Identity.Name;
                string filesPath = "", full_path = "";
                string marker = branditems.MarkerIcon;
                if (icon != null)
                {
                    char DirSeparator = System.IO.Path.DirectorySeparatorChar;
                    filesPath = ConfigurationManager.AppSettings["ItemMarkerIconLocation"];
                    full_path = Server.MapPath(filesPath).Replace("Brands", "").Replace("Admin", "");
                    branditems.MarkerIcon = FileUpload.UploadFile(icon, full_path);
                }

                db.Entry(branditems).State = EntityState.Modified;
                db.SaveChanges();

                if (marker + "" != "")
                    FileUpload.DeleteFile(marker, full_path);

                if (icon != null)
                {
                    string filename = branditems.ItemID + "_" + icon.FileName.Replace(" ", "_").Replace("-", "_");
                    branditems.MarkerIcon = FileUpload.UploadFile(icon, filename, full_path);
                    db.Entry(branditems).State = EntityState.Modified;
                    db.SaveChanges();
                }
                return RedirectToAction("Index", new { keyword = TempData["CurrentKeyword"], CategoryID = TempData["CategoryID"], BrandID = TempData["BrandID"], page = TempData["CurrentPage"], UserCreate = TempData["CurrentCreateUser"], IsShow = TempData["CurrentIsShow"] });
            }
            ViewBag.BrandID = new SelectList(db.Brands.Where(a => a.IsActive).OrderBy(a => a.BrandName), "BrandID", "BrandName", branditems.BrandID);
            return View(branditems);
        }


        [Authorize]
        public ActionResult Copy(int id = 0)
        {
            BrandItems branditems = db.BrandItems.Find(id);
            if (branditems == null)
            {
                return HttpNotFound();
            }
            ViewBag.BrandID = new SelectList(db.Brands.Where(a => a.IsActive).OrderBy(a => a.BrandName), "BrandID", "BrandName", branditems.BrandID);
            return View(branditems);
        }

        [Authorize]
        [HttpPost, ValidateInput(false)]
        [ValidateAntiForgeryToken]
        public ActionResult Copy(BrandItems branditems, HttpPostedFileBase icon)
        {
            if (db.BrandItems.Where(a => a.IsActive && (a.ItemName == branditems.ItemName || a.ItemName_EN == branditems.ItemName_EN)).Count() > 0)
            {
                ModelState.AddModelError("CategoryName", "Already Exists Item name");
            }
            else if (ModelState.IsValid)
            {
                branditems.IsActive = true;
                branditems.CreateDate = DateTime.Now;
                branditems.CreateUser = User.Identity.Name;
                string filesPath = "", full_path = "";
                if (icon != null)
                {
                    char DirSeparator = System.IO.Path.DirectorySeparatorChar;
                    filesPath = ConfigurationManager.AppSettings["ItemMarkerIconLocation"];
                    full_path = Server.MapPath(filesPath).Replace("Brands", "").Replace("Admin", "");
                    branditems.MarkerIcon = FileUpload.UploadFile(icon, full_path);
                }
                db.BrandItems.Add(branditems);
                db.SaveChanges();
                if (icon != null)
                {
                    string filename = branditems.ItemID + "_" + icon.FileName.Replace(" ", "_").Replace("-", "_");
                    branditems.MarkerIcon = FileUpload.UploadFile(icon, filename, full_path);
                    db.Entry(branditems).State = EntityState.Modified;
                    db.SaveChanges();
                }
                return RedirectToAction("Index", new { keyword = TempData["CurrentKeyword"], CategoryID = TempData["CategoryID"], BrandID = TempData["BrandID"], page = TempData["CurrentPage"], UserCreate = TempData["CurrentCreateUser"], IsShow = TempData["CurrentIsShow"] });
            }

            ViewBag.BrandID = new SelectList(db.Brands.Where(a => a.IsActive).OrderBy(a => a.BrandName), "BrandID", "BrandName", branditems.BrandID);
            return View(branditems);
        }

        //
        // GET: /Admin/Items/Delete/5
        [Authorize]
        public ActionResult Delete(int id = 0)
        {
            BrandItems branditems = db.BrandItems.Find(id);
            if (branditems == null)
            {
                return HttpNotFound();
            }
            return View(branditems);
        }

        [Authorize]
        public ViewResult ImageList(int id)
        {
            BrandItems item = db.BrandItems.Find(id);
            string path = ConfigurationManager.AppSettings["ItemImageLocation"] + "\\" + item.ItemID;
            path = Server.MapPath(path);
            List<string> list = new List<string>();
            if (Directory.Exists(path))
            {
                string[] files = Directory.GetFiles(path);

                foreach (string s in files)
                {
                    string filename = Path.GetFileName(s);
                    System.IO.File.Move(s, s.Replace(" ", "_").Replace("-", "_"));
                    if (filename.ToLower().IndexOf(".jpg") >= 0 || filename.ToLower().IndexOf(".png") >= 0 || filename.ToLower().IndexOf(".gif") >= 0)
                        list.Add(ConfigurationManager.AppSettings["ItemImageLocation"].Replace("~", "../../../..") + "/" + item.ItemID + "/" + filename.Replace(" ", "_").Replace("-", "_"));

                }
            }
            ViewBag.ImageList = list;
            return View(item);
        }
        [HttpPost]
        [Authorize]
        public ActionResult AddImages(int id, HttpPostedFileBase file)
        {
            var item = db.BrandItems.Find(id);
            if (ModelState.IsValid)
            {
                //HttpPostedFileBase hpf = Request.Files[0] as HttpPostedFileBase;

                if (file != null)
                {
                    char DirSeparator = System.IO.Path.DirectorySeparatorChar;
                    string FilesPath = ConfigurationManager.AppSettings["ItemImageLocation"];
                    string full_path = Server.MapPath(FilesPath).Replace("Items", "").Replace("AddImages", "").Replace(" ", "_").Replace("-", "_") + "\\" + item.ItemID;
                    FileUpload.UploadFile(file, full_path);
                }
                return RedirectToAction("ImageList", new { id = item.ItemID });
            }
            return View(item);
        }

        [Authorize]
        public ActionResult DeleteImage(int id, string image)
        {
            image = image.Replace("../", "");

            string FilesPath = ConfigurationManager.AppSettings["ItemImageLocation"];
            string full_path = Server.MapPath(FilesPath);
            FilesPath = Path.Combine(full_path, id + "\\" + image.Substring(image.LastIndexOf('/') + 1));
            if (System.IO.File.Exists(FilesPath))
            {
                System.IO.File.Delete(FilesPath);
            }
            return RedirectToAction("ImageList", new { id = id });

        }

        //
        // POST: /Admin/Items/Delete/5
        [Authorize]
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public ActionResult DeleteConfirmed(int id)
        {
            BrandItems branditems = db.BrandItems.Find(id);
            db.BrandItems.Remove(branditems);
            db.SaveChanges();
            return RedirectToAction("Index", new { keyword = TempData["CurrentKeyword"], CategoryID = TempData["CategoryID"], BrandID = TempData["BrandID"], page = TempData["CurrentPage"], UserCreate = TempData["CurrentCreateUser"], IsShow = TempData["CurrentIsShow"] });
        }
        [Authorize]
        public ActionResult KeywordBuilder(int itemid = 0)
        {
            
            var xxx = from i in db.BrandItems

                      where (i.Street != null || i.District != null || i.City != null) && (i.ItemID == itemid || itemid == 0)
                      select new
                      {
                          i.ItemID,
                          i.ItemName,
                          i.ItemName_EN,
                          i.tbl_Brands.BrandName,
                          i.tbl_Brands.BrandName_EN,
                          i.tbl_Brands.tbl_Categories.CategoryName,
                          i.tbl_Brands.tbl_Categories.CategoryName_EN,
                          BrandKeyword = i.tbl_Brands.Keyword_Unsign,
                          CategoryKeyword = i.tbl_Brands.tbl_Categories.Keyword_Unsign,
                          i.FullAddress,
                          i.Street,
                          i.District,
                          i.City
                          , i.BrandID
                      };
            var items = xxx.ToList();
            string keyword = "";
            string keyword_us = "";
            foreach (var item in items)
            {
                keyword = "";
                keyword_us = "";
                var list = db.SP_GetKeyword1(item.Street, item.District, item.City);
                var temp = list.ToList();
                keyword += ";" + item.FullAddress;
                keyword += ";" + item.ItemName_EN;
                keyword += ";" + item.BrandName;
                keyword += ";" + (item.BrandName_EN == null ? "" : item.BrandName_EN);
                keyword += ";" + item.CategoryName;
                keyword += ";" + item.CategoryName_EN;

                keyword_us += ";" + StripDiacritics(item.FullAddress);
                keyword_us += ";" + StripDiacritics(item.ItemName_EN);
                keyword_us += ";" + StripDiacritics(item.BrandName);
                keyword_us += ";" + StripDiacritics(item.BrandName_EN);
                keyword_us += ";" + StripDiacritics(item.CategoryName);
                keyword_us += ";" + StripDiacritics(item.CategoryName_EN);
                keyword_us += ";" + StripDiacritics(item.CategoryKeyword);
                keyword_us += ";" + StripDiacritics(item.BrandKeyword);

                var relateCategory = from a in db.SP_Brand_Categories(item.BrandID)
                                     join c in db.Categories on a.CategoryID equals c.CategoryID
                                     where a.Checked != null && a.Checked.Value == true
                                     select new { a.CategoryID, c.Keyword, c.Keyword_Unsign };
                foreach (var cate in relateCategory)
                {
                    keyword += ";" + cate.Keyword;

                    keyword_us += ";" + cate.Keyword_Unsign;
                }
                var properties = from a in db.SP_Brand_Properties(item.BrandID)
                                     join c in db.Properties on a.PropertyID equals c.PropertyID
                                     where a.PropertyValue  == true
                                     select new { a.PropertyID, c.PropertyName, c.PropertyName_EN };
                foreach (var cate in properties)
                {
                    keyword += ";" + cate.PropertyName;

                    keyword_us += ";" + cate.PropertyName_EN;
                    keyword_us += ";" + StripDiacritics(cate.PropertyName);
                }

                if (temp.Where(a => a.type == 1).ToList().Count == 0)
                {
                    keyword = keyword + ";" + item.BrandName + " " + item.Street;
                    keyword_us = keyword_us + ";" + StripDiacritics(item.BrandName) + " " + StripDiacritics(item.Street);
                }
                if (temp.Where(a => a.type == 2).ToList().Count == 0)
                {
                    keyword = keyword + ";" + item.BrandName + " " + item.District;
                    keyword_us = keyword_us + ";" + StripDiacritics(item.BrandName) + " " + StripDiacritics(item.District);
                }
                if (temp.Where(a => a.type == 3).ToList().Count == 0)
                {
                    keyword = keyword + ";" + item.BrandName + " " + item.City;
                    keyword_us = keyword_us + ";" + StripDiacritics(item.BrandName) + " " + StripDiacritics(item.City);
                }

                
                list = db.SP_GetKeyword1(item.Street, item.District, item.City);
                foreach (var key in list)
                {
                    if (key.type == 1)//street
                    {
                        string[] words = key.street.Split(';');

                        foreach (var word in words)
                            if (words.Length > 0)
                                keyword = keyword + ";" + item.BrandName + " " + word;
                    }
                    else if (key.type == 2)//district
                    {
                        string[] words = key.district.Split(';');

                        foreach (var word in words)
                            if (words.Length > 0)
                                keyword = keyword + ";" + item.BrandName + " " + word;
                    }
                    if (key.type == 3)//city
                    {
                        string[] words = key.city.Split(';');

                        foreach (var word in words)
                            if (words.Length > 0)
                                keyword = keyword + ";" + item.BrandName + " " + word;
                    }
                    if (key.type == 1)//street
                    {
                        string[] words = key.street_us.Split(';');

                        foreach (var word in words)
                            if (words.Length > 0)
                                keyword_us = keyword_us + ";" + item.BrandName + " " + word;
                    }
                    else if (key.type == 2)//district
                    {
                        string[] words = key.district_us.Split(';');

                        foreach (var word in words)
                            if (words.Length > 0)
                                keyword_us = keyword_us + ";" + item.BrandName + " " + word;
                    }
                    if (key.type == 3)//city
                    {
                        string[] words = key.city_us.Split(';');

                        foreach (var word in words)
                            if (words.Length > 0)
                                keyword_us = keyword_us + ";" + item.BrandName + " " + word;
                    }
                }
                var branditem = db.BrandItems.Find(item.ItemID);
                if (branditem != null)
                {
                    branditem.Keyword = keyword;
                    branditem.Keyword_unsign = keyword_us;
                    db.Entry(branditem).State = EntityState.Modified;
                    db.SaveChanges();
                }
            }

            ViewBag.CategoryID = new SelectList(db.Categories, "CategoryID", "CategoryName");
            ViewBag.BrandID = new SelectList(db.Brands, "BrandID", "BrandName");
            return RedirectToAction("index", new { keyword = TempData["CurrentKeyword"], CategoryID = TempData["CategoryID"], BrandID = TempData["BrandID"], page = TempData["CurrentPage"], UserCreate = TempData["CurrentCreateUser"], IsShow = TempData["CurrentIsShow"] });
        }

        public static string StripDiacritics(string accented)
        {
            if (accented == null) return "";
            Regex regex = new Regex("\\p{IsCombiningDiacriticalMarks}+");

            string strFormD = accented.Normalize(NormalizationForm.FormD);
            return regex.Replace(strFormD, String.Empty).Replace('\u0111', 'd').Replace('\u0110', 'D');
        }
        [Authorize]
        public ActionResult ItemProperties(int id = 0)
        {
            var result = db.SP_Item_Properties(id);
            if (result == null || result.Where(a => a.PropertyValue).Count() == 0)
            {
                ViewBag.ItemP_HasValue = false;
                var item = db.BrandItems.Find(id);
                if (item != null)
                {
                    var brandProperties = db.SP_Brand_Properties(item.BrandID);
                    ViewBag.BrandProperties = brandProperties;
                }
            }
            else ViewBag.ItemP_HasValue = true;
            TempData["ItemID"] = id;
            return View(db.SP_Item_Properties(id));
        }
        [Authorize]
        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult ItemProperties(string[] MyCheckList)
        {
            int itemid = Convert.ToInt32(TempData["ItemID"]);

            db.SP_RemoveItemProperties(itemid);

            db.SaveChanges();
            foreach (var item in MyCheckList)
            {
                int propertyid = Convert.ToInt32(item);
                var result = db.ItemProperties.Where(a => a.ItemID == itemid && a.PropertyID == propertyid);
                ItemProperties ip = result.FirstOrDefault();
                if (ip != null)
                {
                    ip.PropertyValue = true;
                    db.Entry(ip).State = EntityState.Modified;
                }
                else
                {
                    ip = new ItemProperties();
                    ip.ItemID = itemid;
                    ip.PropertyID = propertyid;
                    ip.PropertyValue = true;
                    db.ItemProperties.Add(ip);
                }
                db.SaveChanges();
                TempData["ItemID"] = null;
            }
            ViewBag.CategoryID = new SelectList(db.Categories, "CategoryID", "CategoryName");
            ViewBag.BrandID = new SelectList(db.Brands, "BrandID", "BrandName");
            return RedirectToAction("index", new { keyword = TempData["CurrentKeyword"], CategoryID = TempData["CategoryID"], BrandID = TempData["BrandID"], page = TempData["CurrentPage"], UserCreate = TempData["CurrentCreateUser"], IsShow = TempData["CurrentIsShow"] });
        }
        public ActionResult BuildXMLSEO()
        {
            string filecontent = @"<?xml version=""1.0"" encoding=""utf-8""?>
                        <urlset xmlns=""http://www.sitemaps.org/schemas/sitemap/0.9"" xmlns:xsi=""http://www.w3.org/2001/XMLSchema-instance"" xsi:schemaLocation=""http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd"">
                          <url>
                            <loc>http://www.timdau.vn</loc>
                            <changefreq>weekly</changefreq>
                            <lastmod>2010-08-06</lastmod>
                          </url>
                          <url>
                            <loc>http://timdau.vn/home/introduction</loc>
                            <changefreq>weekly</changefreq>
                            <lastmod>2010-08-06</lastmod>
                          </url>
                          <url>
                            <loc>http://timdau.vn/home/termandconditionofuse</loc>
                            <changefreq>weekly</changefreq>
                            <lastmod>2010-08-06</lastmod>
                          </url>
                          <url>
                            <loc>http://timdau.vn/home/policy</loc>
                            <changefreq>weekly</changefreq>
                            <lastmod>2010-08-06</lastmod>
                          </url>
                          <url>
                            <loc>http://timdau.vn/home/contactus</loc>
                            <changefreq>weekly</changefreq>
                            <lastmod>2010-08-06</lastmod>
                          </url>
                          {0}
                        </urlset>";
            string temp = @"<url>
                            <loc>{0}</loc>
                            <changefreq>weekly</changefreq>
                            <lastmod>{1}</lastmod>
                          </url>";
            string url = "";
            var items = db.BrandItems.Where(a=>a.IsActive);
            foreach (var item in items)
            {
                url += Environment.NewLine;
                url += string.Format(temp, "http://timdau.vn/detail/" + item.ItemID + "/" + item.ItemName.Trim().Replace(" ", "-").Replace("'", "-").Replace(".", "-").Replace("&", "-"), item.CreateDate.ToString("yyyy-MM-dd"));
            }
            filecontent = string.Format(filecontent, url);
            string filePath = Server.MapPath("../../SitemapSEO.xml");
            if (System.IO.File.Exists(filePath))
                System.IO.File.Delete(filePath);
            System.IO.File.WriteAllText(filePath, filecontent);
            ViewBag.CategoryID = new SelectList(db.Categories, "CategoryID", "CategoryName");
            ViewBag.BrandID = new SelectList(db.Brands, "BrandID", "BrandName");
            return RedirectToAction("index", new { keyword = TempData["CurrentKeyword"], CategoryID = TempData["CategoryID"], BrandID = TempData["BrandID"], page = TempData["CurrentPage"], UserCreate = TempData["CurrentCreateUser"], IsShow = TempData["CurrentIsShow"] });
        
        }
        protected override void Dispose(bool disposing)
        {
            db.Dispose();
            base.Dispose(disposing);
        }
    }
}