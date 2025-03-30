using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ptdm.Domain.Helpers
{
    public class ResultList<T>
    {
        public IEnumerable<T> Data { get; }
        public int TotalCount { get; }

        public ResultList(IEnumerable<T> data, int totalCount)
        {
            Data = data;
            TotalCount = totalCount;
        }
    }
}
