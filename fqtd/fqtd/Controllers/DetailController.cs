using fqtd.Areas.Admin.Models;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Net;
using System.Web;
using System.Web.Mvc;

namespace fqtd.Controllers
{
    public class DetailController : Controller
    {
        public ActionResult Index(int id)
        {
            ViewBag.URL = Request.Url.AbsoluteUri;                   
            ViewBag.Item = new fqtd.Areas.Admin.Models.fqtdEntities().BrandItems.Find(id);
            ViewBag.keywords = WebUtility.HtmlDecode((ViewBag.Item.tbl_Brands).Description);
            ViewBag.description = WebUtility.HtmlDecode((ViewBag.Item.tbl_Brands).Description);    
            ViewBag.Title = (ViewBag.Item.tbl_Brands).BrandName;
            ViewBag.Logo = (ViewBag.Item.tbl_Brands).Logo;

            BrandItems item = ViewBag.Item;
            if (item != null)
            {
                ViewBag.Address = item.FullAddress;
                ViewBag.Phone = item.Phone;
                ViewBag.OpenTime = item.OpenTime;
                ViewBag.LastUpdated = item.ModifyDate == null ? item.CreateDate.ToString("dd/MM/yyyy") : item.ModifyDate.Value.ToString("dd/MM/yyyy");
                ViewBag.Category = item.tbl_Brands.tbl_Categories.CategoryName;
                ViewBag.Map = "http://maps.googleapis.com/maps/api/staticmap?center=" + item.Latitude + ',' + item.Longitude + "&zoom=15&size=682x300&maptype=roadmap&markers=color:blue%7Clabel:A%7C" + item.Latitude + ',' + item.Longitude + "&sensor=false";
            }
            return View("Index");
            
        }      
       
    }
}
